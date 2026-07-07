# ======================================================================================
# Archivo: serializers.py
# Ubicación: backend/interfaz/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este módulo define los serializadores (Serializers) utilizados por Django REST Framework
# para convertir objetos del modelo `UsuarioPersonalizado` en JSON y viceversa.
#
# Contiene:
#   - Serializador general de usuario (`UsuarioSerializer`) usado por el panel admin.
#   - Serializadores especializados para cambio de contraseñas:
#       * `PasswordChangeSerializer`: usuarios autenticados (con JWT).
#       * `PasswordDirectChangeSerializer`:  cambio directo sin sesión activa.
#   - Serializadores adicionales para:
#       * Registros de login (`LoginRecordSerializer`).
#       * Estadísticas de uso (`UserStatisticSerializer`).
#
# Autora: Sara Hernández  
# Colaborador: ChatGPT  
# ======================================================================================


# --------------------------------------------------------------------------------------
# Importaciones necesarias
# --------------------------------------------------------------------------------------
from rest_framework import serializers                                      # Base del sistema de serialización DRF
from django.contrib.auth import password_validation                         # Validadores de contraseñas de Django
from django.utils.translation import gettext_lazy as _                      # Soporte multilenguaje (mensajes traducibles)
from .models import UsuarioPersonalizado                                    # Importamos el modelo de usuario


# ======================================================================================
# CLASE: UsuarioSerializer
# --------------------------------------------------------------------------------------
# Serializador principal del modelo `UsuarioPersonalizado`, utilizado para operaciones 
# CRUD (crear, leer, actualizar, eliminar) desde el panel admin o APIs internas.
# Incluye lógica para hashear contraseñas antes de guardar.
# ======================================================================================
class UsuarioSerializer(serializers.ModelSerializer):
    # Definimos el campo de contraseña como "solo escritura"
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = UsuarioPersonalizado
        # Campos expuestos en la API
        fields = [
            'id', 'nombre', 'email', 'rol', 'is_active', 'last_login', 'password',
            'must_change_password', 'password_changed_at'
        ]
        # Campos que no pueden ser modificados directamente
        read_only_fields = ['id', 'last_login', 'password_changed_at']

    # ------------------------------------------------------------------
    # Crear un nuevo usuario (modo administrador)
    # ------------------------------------------------------------------
    def create(self, validated_data):
        # Extraemos la contraseña (si viene)
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})
        # Instanciamos el usuario sin guardar aún
        user = UsuarioPersonalizado(**validated_data)
        user.set_password(password)    # Hasheamos la contraseña antes de guardar
        user.save()                    # Guardamos en la base de datos
        return user

    # ------------------------------------------------------------------
    # Actualizar un usuario existente (modo administrador)
    # ------------------------------------------------------------------
    def update(self, instance, validated_data):
        # Extraemos contraseña si fue enviada
        password = validated_data.pop('password', None)
        # Actualizamos los campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Si se recibió una nueva contraseña → la rehasheamos
        if password:
            instance.set_password(password)
        instance.save()                # Guardamos los cambios
        return instance


# ======================================================================================
# CLASE: PasswordChangeSerializer
# --------------------------------------------------------------------------------------
# Permite a un usuario autenticado cambiar su contraseña mediante un token JWT válido.
# Endpoint asociado: /api/auth/password/change/
# Body esperado: { "old_password": "...", "new_password": "..." }
# ======================================================================================
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)                   # Contraseña actual
    new_password = serializers.CharField(write_only=True)                   # Nueva contraseña

    # -------------------------------------------------------------
    # Validación de la contraseña actual (old_password)
    # -------------------------------------------------------------
    def validate_old_password(self, value):
        user = self.context['request'].user                                 # Usuario autenticado
        if not user.check_password(value):                                  # Verificamos que coincida
            raise serializers.ValidationError(_('La contraseña actual no es correcta.'))
        return value

    # -------------------------------------------------------------
    # Validaciones generales del nuevo password
    # -------------------------------------------------------------
    def validate(self, attrs):
        user = self.context['request'].user                                 # Usuario autenticado
        new_password = attrs.get('new_password')

        # Evita que la nueva contraseña sea igual a la anterior
        if new_password == attrs.get('old_password'):
            raise serializers.ValidationError({
                'new_password': _('La nueva contraseña debe ser diferente a la actual.')
            })

        # Aplicamos validadores estándar de Django (longitud, fortaleza, etc.)
        password_validation.validate_password(password=new_password, user=user)
        return attrs

    # -------------------------------------------------------------
    # Guardar el nuevo password
    # -------------------------------------------------------------
    def save(self, **kwargs):
        user = self.context['request'].user                                 # Usuario autenticado
        new_password = self.validated_data['new_password']                  # Nueva contraseña validada
        user.set_password(new_password)                                     # Hash de la nueva contraseña
        user.must_change_password = False                                   # Desactiva flag de cambio obligatorio
        user.mark_password_changed()                                        # Registra timestamp de cambio
        user.save()                                                         # Guarda en BD
        return user


# ======================================================================================
# CLASE: PasswordDirectChangeSerializer
# --------------------------------------------------------------------------------------
# Permite cambiar la contraseña sin requerir un JWT o sesión activa.
# Se autentica con email + old_password.
# Endpoint: /api/auth/password/change-direct/
# Body esperado: { "email": "...", "old_password": "...", "new_password": "..." }
# ======================================================================================
class PasswordDirectChangeSerializer(serializers.Serializer):
    email = serializers.EmailField()                                        # Email del usuario
    old_password = serializers.CharField(write_only=True)                   # Contraseña actual
    new_password = serializers.CharField(write_only=True)                   # Nueva contraseña

    # -------------------------------------------------------------
    # Validación completa de credenciales y nueva contraseña
    # -------------------------------------------------------------
    def validate(self, attrs):
        email = (attrs.get('email') or '').strip().lower()                  # Normaliza email
        old_password = attrs.get('old_password')
        new_password = attrs.get('new_password')

        # Intentamos obtener el usuario de la base de datos (case-insensitive)
        try:
            user = UsuarioPersonalizado.objects.get(email__iexact=email)
        except UsuarioPersonalizado.DoesNotExist:
            # Mensaje genérico para evitar filtrar si el usuario existe
            raise serializers.ValidationError(_('Credenciales inválidas.'))

        if not user.is_active:                                              # El usuario debe estar activo
            raise serializers.ValidationError(_('Usuario inactivo.'))

        if not user.check_password(old_password):                           # Validamos contraseña actual
            raise serializers.ValidationError({'old_password': _('La contraseña actual no es correcta.')})

        if old_password == new_password:                                    # Evita repetir contraseña
            raise serializers.ValidationError({'new_password': _('La nueva contraseña debe ser diferente a la actual.')})

        # Validación de políticas de contraseñas (Django)
        password_validation.validate_password(password=new_password, user=user)

        # Inyectamos el usuario validado para usarlo en save()
        attrs['user'] = user
        return attrs

    # -------------------------------------------------------------
    # Guardar nueva contraseña directamente
    # -------------------------------------------------------------
    def save(self, **kwargs):
        user = self.validated_data['user']                                  # Usuario validado
        new_password = self.validated_data['new_password']                  # Nueva contraseña
        user.set_password(new_password)                                     # Set + hash
        user.must_change_password = False                                   # Limpiamos flag de seguridad
        user.mark_password_changed()                                        # Timestamp de cambio
        user.save()                                                         
        return user


# ======================================================================================
# CLASE: LoginRecordSerializer
# --------------------------------------------------------------------------------------
# Serializador para el modelo LoginRecord, que registra los inicios de sesión 
# de los usuarios para propósitos de auditoría o estadísticas.
# ======================================================================================
from .models import LoginRecord, UserStatistic

class LoginRecordSerializer(serializers.ModelSerializer):
    # Relación mostrada como cadena (usa __str__ del modelo)
    usuario = serializers.StringRelatedField()

    class Meta:
        model = LoginRecord
        fields = ['usuario', 'timestamp']                                   # Campos visibles en la API


# ======================================================================================
# CLASE: UserStatisticSerializer
# --------------------------------------------------------------------------------------
# Serializador para el modelo UserStatistic, que almacena tiempo total de uso diario 
# por usuario. Permite visualizar métricas o graficar actividad.
# ======================================================================================
class UserStatisticSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()                              # Mostrar nombre en lugar de ID

    class Meta:
        model = UserStatistic
        fields = ['usuario', 'total_time']                                  # Campos incluidos en la API
