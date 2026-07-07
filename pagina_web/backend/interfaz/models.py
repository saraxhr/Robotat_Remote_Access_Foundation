# ======================================================================================
# Archivo: models.py
# Ubicación: backend/interfaz/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este módulo define el modelo de usuario personalizado para el sistema Robotat,
# reemplazando el modelo de usuario por defecto de Django. 
#
# Permite utilizar el correo electrónico como identificador principal (en lugar del
# nombre de usuario tradicional) y agrega banderas de seguridad para el manejo de
# contraseñas, así como modelos adicionales para registrar:
#   - Historial de logins.
#   - Estadísticas de uso diario.
#   - Sesiones de usuario con duración calculada.
#
# Además, incluye un gestor personalizado (UsuarioManager) que centraliza la creación
# de usuarios y superusuarios bajo una estructura segura y controlada.
#
# Autora: Sara Hernández 
# Colaborador: ChatGPT5
# ======================================================================================


# --------------------------------------------------------------------------------------
# Importaciones necesarias
# --------------------------------------------------------------------------------------
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin  # Clases base para personalizar usuarios
from django.db import models                                                                 # Para definir los campos de los modelos
from django.utils import timezone                                                            # Para obtener fechas y horas 


# ======================================================================================
# CLASE: UsuarioManager
# --------------------------------------------------------------------------------------
# Gestor de creación de usuarios y superusuarios.
# Reemplaza el manager por defecto de Django para permitir el uso de 'email' como
# campo principal (USERNAME_FIELD).
# ======================================================================================
class UsuarioManager(BaseUserManager):

    def create_user(self, email, nombre, password=None, rol='student', **extra_fields):
        """
        Crea un usuario normal del sistema.

        Parámetros:
        - email: correo electrónico (obligatorio, actúa como username).
        - nombre: nombre completo del usuario.
        - password: contraseña (se encripta automáticamente).
        - rol: tipo de usuario (por defecto 'student').
        - extra_fields: diccionario con otros campos opcionales.
        """
        if not email:                                                                       # Validación: si no hay correo → error
            raise ValueError('El usuario debe tener un correo electrónico')                 
        email = self.normalize_email(email)                                                 # Normaliza el formato (minúsculas, etc.)
        user = self.model(email=email, nombre=nombre, rol=rol, **extra_fields)              # Crea instancia sin guardar aún
        user.set_password(password)                                                         # Hashea la contraseña (no se guarda en texto plano)
        user.save(using=self._db)                                                           # Guarda el usuario en la base de datos
        return user                                                                         # Retorna el usuario creado

    def create_superuser(self, email, nombre, password, **extra_fields):
        """
        Crea un superusuario con privilegios completos.
        - Fuerza las banderas is_staff e is_superuser a True.
        - Asigna el rol 'admin' por coherencia con el sistema.
        """
        extra_fields.setdefault('is_staff', True)                                           # Activa acceso al panel de administración
        extra_fields.setdefault('is_superuser', True)                                       # Asigna permisos de superusuario
        return self.create_user(email, nombre, password, rol='admin', **extra_fields)       # Reutiliza la función anterior


# ======================================================================================
# CLASE: UsuarioPersonalizado
# --------------------------------------------------------------------------------------
# Modelo de usuario principal del sistema Robotat.
# Extiende de AbstractBaseUser y PermissionsMixin, para:
#   - Utilizar el email como identificador único.
#   - Incluir permisos/grupos estándar de Django.
#   - Incorporar campos personalizados como el rol y banderas de seguridad.
# ======================================================================================
class UsuarioPersonalizado(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario principal.
    Sustituye el 'username' tradicional por 'email' como identificador único.
    """

    # ------------------------------
    # Definición de roles permitidos
    # ------------------------------
    ROLES = [
        ('admin', 'Administrador'),                                                         # Usuario con privilegios de gestión total
        ('student', 'Estudiante'),                                                          # Usuario con acceso limitado
        ('researcher', 'Investigador'),                                                     # Usuario con acceso intermedio
    ]

    # ------------------------------
    # Campos principales del usuario
    # ------------------------------
    email = models.EmailField(unique=True)                                                  # Identificador único (login)
    nombre = models.CharField(max_length=100)                                               # Nombre legible del usuario
    rol = models.CharField(max_length=20, choices=ROLES, default='student')                 # Rol del usuario (limitado a ROLES)

    # ------------------------------
    # Banderas estándar de Django
    # ------------------------------
    is_active = models.BooleanField(default=True)                                           # Determina si la cuenta está activa
    is_staff = models.BooleanField(default=False)                                           # Permite acceso al panel admin

    # ------------------------------
    # Banderas de seguridad para contraseñas
    # ------------------------------
    must_change_password = models.BooleanField(                                             # Forzar cambio de contraseña
        default=False,                                                                      # Por defecto está desactivado
        help_text=(
            'Si está activo, el usuario deberá cambiar su contraseña la próxima vez que inicie sesión.'
        )
    )
    password_changed_at = models.DateTimeField(                                             # Fecha/hora del último cambio de contraseña
        null=True,                                                                          # Puede ser nulo al crear usuario nuevo
        blank=True,                                                                         # No se requiere en formularios
        help_text='Fecha y hora del último cambio de contraseña.'
    )

    # ------------------------------
    # Configuración interna de Django Auth
    # ------------------------------
    USERNAME_FIELD = 'email'                                                                # Campo usado como "username"
    REQUIRED_FIELDS = ['nombre']                                                            # Campos requeridos adicionales

    # ------------------------------
    # Manager personalizado
    # ------------------------------
    objects = UsuarioManager()                                                              # Asocia el manager definido arriba

    # ------------------------------
    # Métodos útiles
    # ------------------------------
    def __str__(self):
        """Devuelve una representación legible del usuario."""
        return f"{self.nombre} ({self.email})"                                              # Ejemplo: "Sara (her21743@uvg.edu.gt)"

    def mark_password_changed(self):
        """Marca el timestamp actual como fecha de cambio de contraseña."""
        self.password_changed_at = timezone.now()                                           # Registra el cambio de contraseña


# ======================================================================================
# CLASE: LoginRecord
# --------------------------------------------------------------------------------------
# Registra los inicios de sesión de cada usuario.
# Sirve para auditoría o estadísticas de uso del sistema.
# ======================================================================================
class LoginRecord(models.Model):
    usuario = models.ForeignKey(UsuarioPersonalizado, on_delete=models.CASCADE)              # Relación 1:N (usuario → logins)
    timestamp = models.DateTimeField(auto_now_add=True)                                     # Fecha/hora automática de login

    def __str__(self):
        """Muestra email y hora del login."""
        return f"{self.usuario.email} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"


# ======================================================================================
# CLASE: UserStatistic
# --------------------------------------------------------------------------------------
# Registra el tiempo total acumulado de uso por día de cada usuario.
# Permite analizar actividad diaria, rendimiento o métricas de uso.
# ======================================================================================
class UserStatistic(models.Model):
    usuario = models.ForeignKey(UsuarioPersonalizado, on_delete=models.CASCADE)              # Usuario asociado
    total_time = models.FloatField(default=0.0)                                              # Minutos acumulados del día
    date = models.DateField(default=timezone.localdate)                                      # Fecha de la estadística (día actual)

    class Meta:
        unique_together = ('usuario', 'date')                                               # Evita duplicados por usuario y día
        ordering = ['-date']                                                                # Ordena de la más reciente a la más antigua

    def __str__(self):
        """Devuelve una representación legible de la estadística."""
        return f"{self.usuario.email} - {self.date}: {self.total_time:.1f} min"


# ======================================================================================
# CLASE: UserSession
# --------------------------------------------------------------------------------------
# Registra las sesiones activas de cada usuario.
# Al cerrar la sesión, calcula automáticamente la duración en minutos.
# ======================================================================================
class UserSession(models.Model):
    usuario = models.ForeignKey(UsuarioPersonalizado, on_delete=models.CASCADE)              # Relación con el usuario
    start_time = models.DateTimeField(auto_now_add=True)                                    # Momento de inicio
    end_time = models.DateTimeField(null=True, blank=True)                                  # Momento de fin (puede no existir aún)
    duration = models.FloatField(default=0.0)                                               # Duración total en minutos

    def close(self):
        """
        Cierra la sesión y calcula la duración total.
        Este método debe llamarse al hacer logout o cerrar sesión desde el frontend.
        """
        from django.utils import timezone
        if not self.end_time:                                                               # Solo si aún no se había cerrado
            self.end_time = timezone.now()                                                  # Registra fin de sesión
            delta = self.end_time - self.start_time                                         # Calcula diferencia temporal
            self.duration = delta.total_seconds() / 60.0                                    # Convierte a minutos
            self.save()                                                                     # Guarda el cambio en BD
        return self.duration                                                                # Retorna la duración en minutos

    def __str__(self):
        """Devuelve una representación legible de la sesión."""
        return f"{self.usuario.email} - {self.duration:.1f} min"
