# ======================================================================================
# Archivo: views.py
# Ubicación: backend/interfaz/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este módulo define las vistas y endpoints de la aplicación "interfaz".
# Incluye toda la lógica de autenticación de usuarios, inicio y cierre de sesión,
# cambio de contraseñas, administración de usuarios y comunicación MQTT el Pololu.
#
# Autora: Sara Hernández 
# Colaborador: ChatGPT 
# ======================================================================================


# === Librerías base de Django ===
from django.contrib.auth import authenticate  # Función para autenticar credenciales de usuario
from django.http import JsonResponse          # Permite devolver respuestas JSON
from django.views.decorators.csrf import csrf_exempt  # Desactiva protección CSRF en vistas específicas
import json                                   # Librería estándar para manejar datos JSON

# === Django REST Framework ===
from rest_framework import viewsets, permissions                 # Clases base para vistas y control de permisos
from rest_framework.decorators import api_view, permission_classes # Decoradores para declarar endpoints y permisos
from rest_framework.response import Response                     # Clase de respuesta del framework
from rest_framework.permissions import IsAuthenticated, AllowAny  # Permisos de autenticación y acceso libre
from rest_framework.views import APIView                          # Clase base para vistas API personalizadas

# === Modelos y serializadores ===
from .models import UsuarioPersonalizado, LoginRecord, UserStatistic  # Modelos de usuarios y estadísticas
from .serializers import (
    UsuarioSerializer,                   # Serializador principal de usuario
    PasswordChangeSerializer,            # Serializador para cambio de contraseña con JWT
    PasswordDirectChangeSerializer,      # Serializador para cambio de contraseña con credenciales
    LoginRecordSerializer,               # Serializador de registros de inicio de sesión
    UserStatisticSerializer,             # Serializador de estadísticas de uso
)
from .serializers_jwt import CustomTokenObtainPairSerializer  # Serializer JWT personalizado

# === JWT Login View ===
from rest_framework_simplejwt.views import TokenObtainPairView  # Vista base de SimpleJWT para obtención de tokens

# === Utilidades ===
from datetime import datetime             # Manejo de fechas y tiempos
from django.utils import timezone          # Fechas y horas conscientes de zona horaria
from .models import UserSession, UserStatistic  # Modelos de sesiones y estadísticas
from copy import deepcopy                  # Permite clonar objetos sin modificar los originales


# ---------------------------------------------------------------------
# LOGIN SIMPLE (correo + contraseña sin token, útil para pruebas)
# ---------------------------------------------------------------------
@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)                  # Convierte el cuerpo del request a diccionario
            email = data.get('email', '').strip().lower()    # Obtiene y limpia el email
            password = data.get('password', '').strip()      # Obtiene y limpia la contraseña

            if not email or not password:                    # Verifica que ambos campos estén presentes
                return JsonResponse({'error': 'Correo y contraseña son obligatorios.'}, status=400)

            user = authenticate(request, email=email, password=password)  # Autentica credenciales

            if user is None:                                 # Si no existe el usuario o contraseña incorrecta
                return JsonResponse({'error': 'Credenciales inválidas.'}, status=401)

            if not user.is_active:                           # Verifica que el usuario esté activo
                return JsonResponse({'error': 'Usuario inactivo.'}, status=403)

            LoginRecord.objects.create(usuario=user)         # Registra el inicio de sesión
            hoy = timezone.localdate()                       # Obtiene la fecha local actual
            UserStatistic.objects.get_or_create(usuario=user, date=hoy)  # Crea estadística si no existe

            return JsonResponse({
                'mensaje': 'Inicio de sesión exitoso',
                'nombre': user.nombre,
                'email': user.email,
                'role': getattr(user, 'rol', None),          # Devuelve el rol del usuario
            })

        except json.JSONDecodeError:                         # Maneja errores de formato JSON
            return JsonResponse({'error': 'Formato de datos inválido.'}, status=400)

    return JsonResponse({'error': 'Método no permitido.'}, status=405)


# ---------------------------------------------------------------------
# LOGIN CON JWT PERSONALIZADO
# Registra automáticamente el login y crea UserStatistic si no existe.
# ---------------------------------------------------------------------
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer        # Usa el serializer JWT personalizado

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)     # Llama a la autenticación JWT estándar

        if response.status_code == 200:                       # Si el login fue exitoso
            email = request.data.get('email')
            try:
                user = UsuarioPersonalizado.objects.get(email=email)
                UserSession.objects.filter(usuario=user, end_time__isnull=True).update(end_time=timezone.now())

                for session in UserSession.objects.filter(usuario=user, end_time__isnull=False, duration=0):
                    delta = session.end_time - session.start_time
                    duration = delta.total_seconds() / 60.0
                    session.duration = duration
                    session.save()

                    hoy = timezone.localdate()
                    stat, _ = UserStatistic.objects.get_or_create(usuario=user, date=hoy)
                    stat.total_time += duration
                    stat.save()

                LoginRecord.objects.create(usuario=user)       # Registra el nuevo login
                UserSession.objects.create(usuario=user)       # Crea una nueva sesión activa

                if isinstance(response.data, dict):            # Añade el rol al JSON de respuesta
                    response.data['role'] = getattr(user, 'rol', '')

            except UsuarioPersonalizado.DoesNotExist:
                pass

        return response


# ---------------------------------------------------------------------
# API: CRUD COMPLETO DE USUARIOS (solo admin)
# ---------------------------------------------------------------------
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        rol = str(getattr(user, 'rol', '') or '').strip().lower()
        return (
            getattr(user, 'is_staff', False)
            or getattr(user, 'is_superuser', False)
            or rol == 'admin'
            or rol == 'administrador'
        )


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = UsuarioPersonalizado.objects.all().order_by("id")  # Consulta todos los usuarios
    serializer_class = UsuarioSerializer                          # Usa el serializador de usuarios
    permission_classes = [IsAuthenticated, IsAdmin]               # Solo admins autenticados pueden acceder


# ---------------------------------------------------------------------
# API: OBTENER EL USUARIO AUTENTICADO
# ---------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    usuario = request.user
    return Response({
        'id': usuario.id,
        'nombre': getattr(usuario, 'nombre', ''),
        'email': getattr(usuario, 'email', ''),
        'role': getattr(usuario, 'rol', ''),
        'activo': usuario.is_active,
        'ultimo_acceso': usuario.last_login,
        'must_change_password': getattr(usuario, 'must_change_password', False),
        'password_changed_at': getattr(usuario, 'password_changed_at', None),
    })


# ---------------------------------------------------------------------
# API: CAMBIO DE CONTRASEÑA (USUARIO AUTENTICADO, requiere JWT)
# ---------------------------------------------------------------------
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Tu contraseña fue actualizada correctamente.'}, status=200)


# ---------------------------------------------------------------------
# API: CAMBIO DIRECTO CON CREDENCIALES (SIN JWT)
# ---------------------------------------------------------------------
class ChangePasswordWithCredentialsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordDirectChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'detail': 'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.'
        }, status=200)


# ---------------------------------------------------------------------
# API: LISTADO DE LOGINS (para Dashboard)
# ---------------------------------------------------------------------
class LoginRecordListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.localdate()
        registros = LoginRecord.objects.filter(timestamp__date=today).order_by('-timestamp')
        serializer = LoginRecordSerializer(registros, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------
# API: LISTADO DE ESTADÍSTICAS DE USO (para Dashboard)
# ---------------------------------------------------------------------
class UserStatisticListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        hoy = timezone.localdate()
        updated_stats = []

        for stat in UserStatistic.objects.filter(date=hoy):
            active_sessions = UserSession.objects.filter(usuario=stat.usuario, end_time__isnull=True)
            total_extra = sum((timezone.now() - s.start_time).total_seconds() / 60.0 for s in active_sessions)

            clone = deepcopy(stat)
            clone.total_time = stat.total_time + total_extra
            updated_stats.append(clone)

        serializer = UserStatisticSerializer(updated_stats, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------
# API: LOGOUT (cierra sesión y actualiza tiempo de uso)
# ---------------------------------------------------------------------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        session = UserSession.objects.filter(usuario=user, end_time__isnull=True).order_by('-start_time').first()

        if session:
            duration = session.close()
            hoy = timezone.localdate()
            stat, _ = UserStatistic.objects.get_or_create(usuario=user, date=hoy)
            stat.total_time += duration
            stat.save()
        else:
            duration = 0.0

        return Response({'detail': f'Sesión cerrada. Duración: {duration:.1f} minutos.'}, status=200)


# ======================================================================================
# Enviar comando MQTT al Pololu
# ======================================================================================
from mqtt_bridge.mqtt_client import publish_command

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_comando(request):
    try:
        packet = request.data
        print(f"[DEBUG VIEW] Recibido paquete desde el frontend: {packet}")

        if not isinstance(packet, dict) or 'pid' not in packet:
            return Response({'error': 'Formato de paquete inválido o falta campo pid.'}, status=400)

        publish_command(packet)
        return Response({'status': 'ok', 'mensaje': 'Comando MQTT publicado exitosamente.'}, status=200)

    except Exception as e:
        return Response({'error': f'No se pudo enviar el comando: {str(e)}'}, status=500)
