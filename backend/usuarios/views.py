from rest_framework.generics import ListAPIView, CreateAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario, Docente, Estudiante
from .serializers import UsuarioSerializer, UsuarioCreateSerializer, UsuarioUpdateSerializer, ImportacionResponseSerializer
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .services.import_service import ImportService
from django.contrib.auth.hashers import check_password



# 🔹 Lista usuarios existentes
class UsuarioListView(ListAPIView):
    serializer_class = UsuarioSerializer

    def get(self, request):
        pagina = int(request.GET.get('pagina', 1))
        limite = int(request.GET.get('limite', 10))

        usuarios_qs = Usuario.objects.all().order_by('id')

        # filtros
        nombre = request.GET.get('nombre')
        rol = request.GET.get('rol')

        if nombre:
            usuarios_qs = usuarios_qs.filter(nombre__icontains=nombre)
        if rol:
            usuarios_qs = usuarios_qs.filter(rol_id=rol)

        total = usuarios_qs.count()

        inicio = (pagina - 1) * limite
        fin = inicio + limite

        usuarios = usuarios_qs[inicio:fin]

        serializer = UsuarioSerializer(usuarios, many=True)

        return Response({
            'usuarios': serializer.data,
            'total': total
        })

# 🔹 Crear un nuevo usuario
class UsuarioCreateView(CreateAPIView):
    serializer_class = UsuarioCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()  
        data = UsuarioSerializer(usuario).data  
        return Response(
            {"mensaje": "Usuario creado correctamente", "usuario": data},
            status=status.HTTP_201_CREATED
        )
    
class UsuarioToggleEstadoView(APIView):

    def patch(self, request, pk):
        try:
            usuario = Usuario.objects.get(pk=pk)
            usuario.estado = 'inactivo' if usuario.estado == 'activo' else 'activo'
            usuario.save()

            return Response({"mensaje": "Estado actualizado"}, status=status.HTTP_200_OK)

        except Usuario.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    
class UsuarioUpdateView(UpdateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioUpdateSerializer
    lookup_field = 'pk'

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Retornar datos actualizados con el serializer de lista
        updated_data = UsuarioSerializer(instance).data
        return Response({
            "mensaje": "Usuario actualizado correctamente",
            "usuario": updated_data
        }, status=status.HTTP_200_OK)
    

class ImportarEstudiantesView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get('archivo')
        
        if not archivo:
            return Response(
                {'error': 'No se proporcionó ningún archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar extensión
        if not archivo.name.endswith(('.xlsx', '.xls')):
            return Response(
                {'error': 'Formato de archivo no válido. Use .xlsx o .xls'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            resultados = ImportService.importar_estudiantes(archivo)
            
            serializer = ImportacionResponseSerializer(resultados)
            
            # Determinar código de respuesta
            if resultados['creados'] > 0 and len(resultados['errores']) == 0:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            elif resultados['creados'] > 0 and len(resultados['errores']) > 0:
                return Response(serializer.data, status=status.HTTP_207_MULTI_STATUS)
            else:
                return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Error al procesar el archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class ImportarDocentesView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get('archivo')
        
        if not archivo:
            return Response(
                {'error': 'No se proporcionó ningún archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not archivo.name.endswith(('.xlsx', '.xls')):
            return Response(
                {'error': 'Formato de archivo no válido. Use .xlsx o .xls'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            resultados = ImportService.importar_docentes(archivo)
            
            serializer = ImportacionResponseSerializer(resultados)
            
            if resultados['creados'] > 0 and len(resultados['errores']) == 0:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            elif resultados['creados'] > 0 and len(resultados['errores']) > 0:
                return Response(serializer.data, status=status.HTTP_207_MULTI_STATUS)
            else:
                return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Error al procesar el archivo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        print(f"📥 Intento de login - Email: {email}")
        
        if not email or not password:
            print("❌ Email o password vacío")
            return Response(
                {'mensaje': 'Correo y contraseña son requeridos'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            usuario = Usuario.objects.get(email=email, estado='activo')
            print(f"✅ Usuario encontrado: {usuario.email}, rol_id: {usuario.rol_id}")
        except Usuario.DoesNotExist:
            print(f"❌ Usuario no encontrado con email: {email}")
            return Response(
                {'mensaje': 'Credenciales inválidas'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verificar contraseña
        print(f"🔐 Verificando contraseña para: {email}")
        print(f"   Password recibida: {password}")
        print(f"   Hash almacenado: {usuario.password}")
        
        if check_password(password, usuario.password):
            print("✅ Contraseña correcta")
            
            rol_nombre = usuario.rol.nombre if usuario.rol else None
            
            # ✅ Obtener estudiante_id si el usuario es estudiante
            estudiante_id = None
            if rol_nombre == 'estudiante':
                try:
                    from .models import Estudiante
                    estudiante = Estudiante.objects.get(usuario_id=usuario.id)
                    estudiante_id = estudiante.id
                    print(f"✅ Estudiante encontrado: ID {estudiante_id}")
                except Estudiante.DoesNotExist:
                    print(f"⚠️ Estudiante no encontrado para usuario_id: {usuario.id}")
                except Exception as e:
                    print(f"❌ Error obteniendo estudiante: {e}")
            
            response_data = {
                'user': {
                    'id': usuario.id,
                    'nombre': usuario.nombre,
                    'apellido': usuario.apellido,
                    'email': usuario.email,
                    'ci': usuario.ci,
                    'rol': rol_nombre,
                    'rol_id': usuario.rol.id if usuario.rol else None,
                    'estado': usuario.estado,
                    'estudiante_id': estudiante_id  # ✅ Agregar estudiante_id
                },
                'token': f'token_{usuario.id}_{usuario.rol.id}'
            }
            
            print(f"✅ Login exitoso - Enviando respuesta: {response_data}")
            return Response(response_data)
        
        print("❌ Contraseña incorrecta")
        return Response(
            {'mensaje': 'Credenciales inválidas'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

class DocentePorUsuarioView(APIView):
    def get(self, request, usuario_id):
        print(f"🔍 Buscando docente con usuario_id: {usuario_id}")
        
        try:
            docente = Docente.objects.get(usuario_id=usuario_id)
            print(f"✅ Docente encontrado: ID {docente.id}")
            return Response({
                'id': docente.id,
                'usuario_id': docente.usuario_id,
                'especialidad': docente.especialidad
            })
        except Docente.DoesNotExist:
            print(f"❌ Docente NO encontrado para usuario_id: {usuario_id}")
            # Listar todos los docentes para debug
            todos = Docente.objects.all().values('id', 'usuario_id')
            print(f"Docentes existentes: {list(todos)}")
            return Response({'error': 'Docente no encontrado'}, status=404)


class EstudiantePorUsuarioView(APIView):
    def get(self, request, usuario_id):
        print(f"🔍 Buscando estudiante con usuario_id: {usuario_id}")
        
        try:
            estudiante = Estudiante.objects.get(usuario_id=usuario_id)
            print(f"✅ Estudiante encontrado: ID {estudiante.id}")
            return Response({
                'estudiante_id': estudiante.id
            })
        except Estudiante.DoesNotExist:
            print(f"❌ Estudiante NO encontrado para usuario_id: {usuario_id}")
            return Response({'estudiante_id': None}, status=404)