# ======================================================================================
# Archivo: serializers_jwt.py
# Ubicación: backend/interfaz/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este módulo define un serializer personalizado para el proceso de autenticación 
# mediante JWT (JSON Web Tokens), reemplazando el comportamiento por defecto del 
# serializer estándar de SimpleJWT.
#
# El serializer permite que los usuarios se autentiquen usando su **correo electrónico**
# en lugar del nombre de usuario tradicional y añade datos adicionales (claims) al 
# token y a la respuesta que recibe el frontend tras iniciar sesión.
#
# Esto garantiza que el token contenga información contextual sobre el usuario, como 
# su nombre y rol dentro del sistema (por ejemplo: "admin", "student" o "researcher").
#
# Autora: Sara Hernández  
# Colaborador: ChatGPT  
# ======================================================================================


# --------------------------------------------------------------------------------------
# Importación de dependencias
# --------------------------------------------------------------------------------------

#  Importa el serializer base de SimpleJWT, que maneja la obtención de tokens 
#   "access" y "refresh" (par de tokens usados para autenticación segura).

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer



# ======================================================================================
# CLASE: CustomTokenObtainPairSerializer
# --------------------------------------------------------------------------------------
# Este serializer redefine la forma en que se generan y devuelven los tokens JWT.
# En lugar de usar "username" para autenticación, se utiliza "email", y además 
# se agregan campos personalizados tanto en el token como en la respuesta JSON.
# ======================================================================================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para el login con JWT usando email como campo de autenticación.
    Añade información adicional al token y a la respuesta devuelta al frontend.
    """

    # -------------------------------------------------------------------------
    # Configuración del campo de autenticación principal
    # -------------------------------------------------------------------------

    #  Django por defecto usa 'username', pero aquí se redefine para usar 'email'.
    #   Esto permite que las credenciales sean validadas usando el correo del usuario.
    username_field = 'email'
    


    # -------------------------------------------------------------------------
    # Personalización de los CLAIMS dentro del token JWT
    # -------------------------------------------------------------------------
    @classmethod
    def get_token(cls, user):
        """
        Genera el token JWT e inserta información adicional (claims personalizados).
        
        Los claims son pares clave-valor que representan información sobre el usuario
        y que el frontend puede usar para mostrar o validar el rol, identidad, etc.
        """
        token = super().get_token(user)   # Llama al método original para generar el token base.

        # --- Claims personalizados añadidos al token ---
        token['email'] = user.email                       # Correo del usuario (identificador único).
        token['nombre'] = getattr(user, 'nombre', '')      # Nombre legible del usuario.
        token['role'] = getattr(user, 'rol', '')           # Rol del usuario (usamos "role" para mantener consistencia con el frontend).

        # Retornamos el token modificado, que ahora contiene los nuevos claims.
        return token


    # -------------------------------------------------------------------------
    # Validación y estructura de la respuesta del login
    # -------------------------------------------------------------------------
    def validate(self, attrs):
        """
        Valida las credenciales del usuario (email + password) y construye la respuesta 
        final que recibirá el frontend.
        
        La respuesta incluye:
          - access token
          - refresh token
          - email
          - nombre
          - role (rol del usuario)
        """
        # Compatibilidad: si el frontend envía accidentalmente 'username' en vez de 'email',
        # lo reasignamos para que el sistema no falle.
        if 'username' in attrs and 'email' not in attrs:
            attrs['email'] = attrs['username']

        # Llama al método original del serializer para realizar la validación base.
        # Este método se encarga de verificar las credenciales y generar los tokens JWT.
        data = super().validate(attrs)

        # Si la autenticación fue correcta, el usuario autenticado se almacena en self.user.
        user = self.user

        # --- Datos extra añadidos a la respuesta JSON final ---
        data['email'] = user.email                        # Correo electrónico del usuario.
        data['nombre'] = getattr(user, 'nombre', '')       # Nombre visible del usuario.
        data['role'] = getattr(user, 'rol', '')            # Rol del usuario en la plataforma.

        # Retornamos el diccionario final que incluye los tokens y la información adicional.
        return data
