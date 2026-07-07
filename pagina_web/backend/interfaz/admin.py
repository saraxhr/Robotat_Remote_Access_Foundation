# ======================================================================================
# Archivo: admin.py
# Ubicación: backend/interfaz/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este módulo define la configuración del panel de administración (Django Admin)
# para el modelo `UsuarioPersonalizado`. 
#
# Permite gestionar usuarios directamente desde el administrador de Django, 
# mostrando y organizando campos relevantes como el rol, el estado de actividad,
# los permisos y configuraciones adicionales de seguridad (por ejemplo, 
# si el usuario debe cambiar su contraseña).
#
# Se personaliza el comportamiento del `UserAdmin` base de Django para adaptarlo 
# al modelo `UsuarioPersonalizado` definido en `models.py`.
#
# Autora: Sara Hernández  
# Colaborador: ChatGPT5
# ======================================================================================


# --------------------------------------------------------------------------------------
# Importaciones necesarias
# --------------------------------------------------------------------------------------
from django.contrib import admin                               # Importa las utilidades del panel de administración de Django.
from django.contrib.auth.admin import UserAdmin                # Importa la clase base 'UserAdmin' usada para modelos de usuario.
from .models import UsuarioPersonalizado                       # Importa el modelo personalizado de usuario definido en models.py.


# --------------------------------------------------------------------------------------
# Registro del modelo `UsuarioPersonalizado` en el panel de administración.
# Esto permite que el modelo aparezca en la interfaz del admin de Django.
# --------------------------------------------------------------------------------------
@admin.register(UsuarioPersonalizado)                          # Registra el modelo con la clase de administración siguiente.
class UsuarioAdmin(UserAdmin):                                 # Se crea una clase personalizada que hereda de `UserAdmin`.
    model = UsuarioPersonalizado                               # Se indica explícitamente el modelo asociado a este administrador.


    # ----------------------------------------------------------------------------------
    # CONFIGURACIÓN DE LA TABLA PRINCIPAL (LISTADO DE USUARIOS)
    # ----------------------------------------------------------------------------------
    list_display = (                                           # Define las columnas visibles en el listado de usuarios.
        'email',                                               # Muestra el correo electrónico como identificador principal.
        'nombre',                                              # Muestra el nombre completo del usuario.
        'rol',                                                 # Muestra el rol asignado (admin, investigador, estudiante).
        'is_active',                                           # Indica si la cuenta está activa o deshabilitada.
        'is_staff',                                            # Indica si tiene acceso al panel de administración.
        'must_change_password',                                # Muestra si el usuario debe cambiar su contraseña al iniciar sesión.
        'password_changed_at',                                 # Fecha de la última vez que cambió su contraseña.
    )

    list_filter = (                                            # Define los filtros laterales disponibles en la vista de lista.
        'rol',                                                 # Permite filtrar por tipo de rol.
        'is_active',                                           # Filtra entre usuarios activos/inactivos.
        'is_staff',                                            # Filtra entre personal administrativo y usuarios normales.
        'is_superuser',                                        # Filtra por superusuarios.
        'groups',                                              # Filtra por grupos de permisos asignados.
        'must_change_password',                                # Filtra usuarios que deben cambiar su contraseña.
    )

    ordering = ('email',)                                      # Ordena la lista de usuarios por su email (alfabéticamente).
    search_fields = ('email', 'nombre')                        # Habilita búsqueda por email o nombre en el buscador del admin.


    # ----------------------------------------------------------------------------------
    # CONFIGURACIÓN DEL FORMULARIO DE EDICIÓN DE USUARIO EXISTENTE
    # ----------------------------------------------------------------------------------
    fieldsets = (                                              # Define las secciones (bloques) del formulario de detalle.
        (None, { 'fields': ('email', 'password') }),           # Sección inicial: credenciales básicas.
        ('Información personal', { 'fields': ('nombre', 'rol') }),  # Sección de datos personales.
        ('Permisos', {                                         # Sección que agrupa todos los permisos y roles administrativos.
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Seguridad', {                                        # Sección dedicada a opciones de seguridad.
            'fields': ('must_change_password', 'password_changed_at')
        }),
        ('Fechas importantes', { 'fields': ('last_login',) }), # Muestra la fecha del último inicio de sesión.
    )


    # ----------------------------------------------------------------------------------
    # CONFIGURACIÓN DEL FORMULARIO DE CREACIÓN DE NUEVO USUARIO ("Add user")
    # ----------------------------------------------------------------------------------
    add_fieldsets = (                                          # Define los campos visibles al crear un usuario nuevo.
        (None, {                                               # Grupo principal (sin título visible).
            'classes': ('wide',),                              # Clase CSS para ensanchar el formulario.
            'fields': (                                        # Lista de campos mostrados al crear un usuario.
                'email',                                       # Email obligatorio.
                'nombre',                                      # Nombre del usuario.
                'rol',                                         # Rol asignado.
                'password1', 'password2',                      # Contraseña y confirmación.
                'is_active', 'is_staff',                       # Estado y permisos.
                'must_change_password',                        # Permite forzar cambio de contraseña tras la creación.
            ),
        }),
    )


    # ----------------------------------------------------------------------------------
    # CAMPOS DE SOLO LECTURA Y ASPECTOS VISUALES
    # ----------------------------------------------------------------------------------
    readonly_fields = (                                        # Define los campos que no pueden editarse manualmente.
        'last_login',                                          # Solo se actualiza automáticamente cuando el usuario inicia sesión.
        'password_changed_at',                                 # Fecha de cambio de contraseña (actualizada por señales o lógica interna).
    )

    filter_horizontal = (                                      # Mejora la interfaz para campos de tipo ManyToMany (como grupos).
        'groups',                                              # Permite seleccionar grupos en una lista dual desplazable.
        'user_permissions',                                    # Igual para permisos individuales.
    )


#Los campos ManyToMany son aquellos que permiten asociar múltiples 
# registros de un modelo con múltiples registros de otro modelo.