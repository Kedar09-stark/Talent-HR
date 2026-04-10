# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AccountsUser
from rest_framework.permissions import IsAuthenticated
from .auth import AccountsUserRefreshToken


class LogoutAPI(APIView):
    """
    Logout by blacklisting the provided refresh token.
    POST body: { "refresh": "<refresh_token>" }
    """
    permission_classes = ()  # allow unauthenticated so client can send refresh token

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

       
        try:
            # validate token can be parsed
            _ = AccountsUserRefreshToken(refresh_token)
            return Response({'detail': 'Logout accepted'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

class UserLoginAPI(APIView):
    """
    Login API for both HR and Candidate using JWT
    """

    # Allow unauthenticated users to POST login credentials
    permission_classes = ()

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        role = request.data.get('role')  # 'HR' or 'Candidate'

        if not username or not password or not role:
            return Response({'error': 'Username, password, and role are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = AccountsUser.objects.get(username=username, password=password, role=role)
            
            # Generate JWT tokens using our custom token class
            refresh = AccountsUserRefreshToken.for_user(user)
            access = str(refresh.access_token)

            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role,
                },
                'refresh': str(refresh),
                'access': access,
            })
        except AccountsUser.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
