from django.contrib import admin
from django_summernote.admin import SummernoteModelAdmin
from .models import Category, Post, Comment
from django.urls import path, reverse
from django.shortcuts import redirect
from django.utils.html import format_html

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Post)
class PostAdmin(SummernoteModelAdmin):
    summernote_fields = ('content',)
    list_display = ('title', 'slug', 'author', 'status', 'created_at')
    list_filter = ('status', 'created_at', 'author', 'category')
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ('status', '-created_at')
    readonly_fields = ('updated_at',)

    # Add a custom button to the admin top bar
    change_list_template = "admin/blog/post_changelist.html"

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at', 'active')
    list_filter = ('active', 'created_at')
    search_fields = ('user__username', 'content')
    actions = ['approve_comments']

    def approve_comments(self, request, queryset):
        queryset.update(active=True)
