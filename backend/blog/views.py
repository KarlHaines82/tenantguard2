from rest_framework import generics, permissions, filters
from .models import Post, Category, Comment
from .serializers import PostListSerializer, PostDetailSerializer, CategorySerializer, CommentSerializer
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from .ai_agents import BlogGeneratorWorkflow
import json

class PostListView(generics.ListAPIView):
    queryset = Post.objects.filter(status='published').order_by('-created_at')
    serializer_class = PostListSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'tags__name', 'category__name']

class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.filter(status='published')
    serializer_class = PostDetailSerializer
    lookup_field = 'slug'

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class CommentCreateView(generics.CreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        post = Post.objects.get(slug=self.kwargs['slug'])
        serializer.save(user=self.request.user, post=post)

@staff_member_required
def ai_generator_view(request):
    return render(request, 'admin/blog/ai_generator.html')

@staff_member_required
def ai_generate_api(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)
    
    data = json.loads(request.body)
    step = data.get('step')
    workflow = BlogGeneratorWorkflow()

    try:
        if step == 'get_topics':
            theme = data.get('theme', 'Tenant Rights')
            result = workflow.run_step_1(theme)
            return JsonResponse({'status': 'success', 'result': result})
        
        elif step == 'generate_content':
            topic = data.get('topic')
            context_urls = [u for u in data.get('context_urls', []) if u and u.strip()]
            result = workflow.run_step_2(topic, context_urls)
            return JsonResponse({'status': 'success', 'result': result})
        
        elif step == 'generate_image':
            title = data.get('title')
            content = data.get('content')
            result = workflow.run_step_3(title, content)
            return JsonResponse({'status': 'success', 'result': result})
        
        elif step == 'save_post':
            title = data.get('title')
            content = data.get('content')
            meta_title = data.get('meta_title')
            meta_description = data.get('meta_description')
            tags = data.get('tags')
            image_url = data.get('image_url')
            
            post = workflow.save_post(
                title=title,
                content=content,
                meta_title=meta_title,
                meta_description=meta_description,
                tags=tags,
                author_id=request.user.id,
                image_url=image_url
            )
            return JsonResponse({'status': 'success', 'post_id': post.id})
            
        return JsonResponse({'status': 'error', 'message': 'Invalid step'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
