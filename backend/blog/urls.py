from django.urls import path
from .views import (
    PostListView, PostDetailView, CategoryListView, 
    CommentCreateView, ai_generator_view, ai_generate_api
)
from .feeds import LatestEntriesFeed

urlpatterns = [
    path('posts/', PostListView.as_view(), name='post-list'),
    path('posts/<slug:slug>/', PostDetailView.as_view(), name='post-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('posts/<slug:slug>/comments/', CommentCreateView.as_view(), name='comment-create'),
    path('feed/', LatestEntriesFeed(), name='post-feed'),
    
    # AI Admin Tools
    path('admin/ai-generator/', ai_generator_view, name='ai-generator'),
    path('admin/blog/ai-generate-api/', ai_generate_api, name='ai-generate-api'),
]
