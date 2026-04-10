from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken as BaseRefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed as JWTAuthenticationFailed
from rest_framework.exceptions import AuthenticationFailed
from .models import AccountsUser
import logging

logger = logging.getLogger(__name__)


class AccountsUserRefreshToken(BaseRefreshToken):
    @classmethod
    def for_user(cls, user):
        token = cls()
        token['user_id'] = user.id
        return token


class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        
        if header is None:
            return None
        
        try:
            raw_token = self.get_raw_token(header)
        except AuthenticationFailed:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, JWTAuthenticationFailed):
            raise AuthenticationFailed('Invalid token')
        
        user_id = validated_token.get('user_id')
        
        if not user_id:
            raise AuthenticationFailed('Invalid token: no user_id')
        
        try:
            user = AccountsUser.objects.get(pk=user_id)
            return (user, validated_token)
        except AccountsUser.DoesNotExist:
            raise AuthenticationFailed('User not found')
        except Exception as e:
            logger.exception('Error in JWT authentication')
            raise AuthenticationFailed(str(e))
