from django.contrib.syndication.views import Feed
from django.urls import reverse
from .models import Post

class LatestEntriesFeed(Feed):
    title = "TenantGuard Blog"
    link = "/blog/"
    description = "Latest updates and research from TenantGuard."

    def items(self):
        return Post.objects.filter(status='published').order_by('-created_at')[:10]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt

    def item_link(self, item):
        return f"/blog/{item.slug}/"
