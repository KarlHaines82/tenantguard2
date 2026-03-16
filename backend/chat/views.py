from rest_framework import generics, permissions
from .models import Message
from .serializers import MessageSerializer
from django.db.models import Q

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(Q(sender=self.request.user) | Q(sender__is_staff=True)).order_by('timestamp')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
