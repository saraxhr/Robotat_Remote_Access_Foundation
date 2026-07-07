# ======================================================================================
# Archivo: urls.py
# Ubicación: backend/robotat_web/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este archivo define las rutas principales del proyecto Django "robotat_web".
# Contiene los endpoints globales para autenticación, administración, cambio
# de contraseña, acceso al perfil, CRUD de usuarios, estadísticas y comunicación
# con el sistema MQTT.
#
# Autora: Sara Hernández 
# Colaborador: ChatGPT 
# ======================================================================================


# Importa las funciones necesarias para definir rutas en Django
from django.contrib import admin                   # Permite acceso al panel de administración
from django.urls import path, include              # Funciones para definir y agrupar rutas
from rest_framework.routers import DefaultRouter   # Router de DRF para CRUDs automáticos

# Importa las vistas desde la app interfaz
from interfaz.views import (
    login_view,                       # Vista de login simple
    UsuarioViewSet,                   # Vista CRUD para usuarios
    CustomLoginView,                  # Vista de login con JWT
    mi_perfil,                        # Vista para obtener datos del usuario autenticado
    ChangePasswordView,               # Vista para cambio de contraseña con JWT
    ChangePasswordWithCredentialsView,# Vista para cambio de contraseña sin JWT
    LoginRecordListView,              # Vista para listar registros de login
    UserStatisticListView,            # Vista para listar estadísticas de uso
    LogoutView,                       # Vista de cierre de sesión
    enviar_comando,                   # Vista para enviar comandos MQTT al pololu
)

# Importa las vistas estándar de SimpleJWT para refrescar tokens
from rest_framework_simplejwt.views import TokenRefreshView


# Crea un enrutador de DRF que manejará las rutas CRUD de usuarios
router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')


# ======================================================================================
# Definición de rutas principales del proyecto
# --------------------------------------------------------------------------------------
# Aquí se definen todas las rutas HTTP disponibles en el backend.
# Cada path asocia una URL con una vista o conjunto de vistas.
# ======================================================================================
urlpatterns = [
    # Ruta del panel administrativo de Django
    path('admin/', admin.site.urls),

    # ---------------------------
    # Autenticación y sesiones
    # ---------------------------
    path('api/login/', login_view),                                   # Login simple sin JWT
    path('api/token/', CustomLoginView.as_view(), name='token_obtain_pair'),  # Login con JWT
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refrescar token
    path('api/mi-perfil/', mi_perfil, name='mi_perfil'),              # Datos del usuario autenticado
    path('api/logout/', LogoutView.as_view(), name='logout'),         # Cierre de sesión

    # ---------------------------
    # Cambio de contraseña
    # ---------------------------
    path('api/auth/password/change/',                                 # Cambio con token JWT
         ChangePasswordView.as_view(), name='password_change'),

    path('api/auth/password/change-direct/',                          # Cambio sin JWT (email + contraseña actual)
         ChangePasswordWithCredentialsView.as_view(), name='password_change_direct'),

    # ---------------------------
    # CRUD de usuarios (admin)
    # ---------------------------
    path('api/', include(router.urls)),                               # Incluye las rutas generadas por el router

    # ---------------------------
    # Rutas de cámaras (video y control PTZ)
    # ---------------------------
    path('', include('camaras.urls')),

    # ---------------------------
    # Estadísticas y logs
    # ---------------------------
    path('api/logins/', LoginRecordListView.as_view(), name='login_records'),      # Lista de inicios de sesión
    path('api/estadisticas/', UserStatisticListView.as_view(), name='user_statistics'),  # Estadísticas de uso

    # ---------------------------
    # RUTA MQTT: Envío de comandos al Pololu
    # ---------------------------
    # Esta ruta recibe un JSON con campos como src, pid, pld, etc. y lo publica
    # en el tópico MQTT correspondiente para ejecutar acciones remotas.
    path('api/enviar-comando/', enviar_comando, name='enviar_comando'),
]
