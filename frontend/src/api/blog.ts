import apiClient from './client';

// 博客类型定义
export interface Blog {
  id?: string;
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  avatar?: string;
  createTime?: string;
  updateTime?: string;
  tags: string[];
  views?: number;
  likes?: number;
  comments?: number;
  status: string;
  category: string;
  coverImage: string;
}

// 标签类型定义
export interface Tag {
  id: number;
  name: string;
  description?: string;
}

// 分类类型定义
export interface Category {
  id: number;
  name: string;
  description?: string;
}

// 获取博客列表
export const getBlogs = async (params?: any) => {
  try {
    const response = await apiClient.get('/api/articles', { params }) as any;
    const result = response.data || response;
    const articles = Array.isArray(result) ? result : (result.items || []);

    const blogs = articles.map((article: any) => ({
      id: article.id?.toString() || '',
      title: article.title,
      content: article.content,
      author: article.author?.username || '未知作者',
      authorId: article.author?.id?.toString() || '',
      avatar: article.author?.avatar || '',
      createTime: article.created_at,
      updateTime: article.updated_at,
      tags: article.tags?.map((tag: any) => tag.name) || [],
      views: article.view_count,
      likes: article.like_count,
      comments: article.comment_count,
      status: article.is_published ? '已发布' : '草稿',
      category: article.category?.name || '其他',
      coverImage: article.cover_image
    }));

    return {
      blogs,
      total: blogs.length
    };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

// 获取单个博客
export const getBlog = async (id: string) => {
  try {
    const response = await apiClient.get(`/api/articles/${id}`) as any;
    const article = response.data || response;
    return {
      id: article.id?.toString() || id,
      title: article.title,
      content: article.content,
      author: article.author?.username || '未知作者',
      authorId: article.author?.id?.toString() || '',
      avatar: article.author?.avatar || '',
      createTime: article.created_at,
      updateTime: article.updated_at,
      tags: article.tags?.map((tag: any) => tag.name) || [],
      views: article.view_count,
      likes: article.like_count,
      comments: article.comment_count,
      status: article.is_published ? '已发布' : '草稿',
      category: article.category?.name || '其他',
      coverImage: article.cover_image
    };
  } catch (error) {
    console.error(`Error fetching blog ${id}:`, error);
    throw error;
  }
};

// 获取所有标签
export const getTags = async (): Promise<Tag[]> => {
  try {
    const response = await apiClient.get<Tag[]>('/api/tags');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// 创建标签
export const createTag = async (name: string): Promise<Tag> => {
  try {
    const response = await apiClient.post<Tag>('/api/tags', { name });
    return response.data;
  } catch (error) {
    console.error(`Error creating tag: ${name}`, error);
    throw error;
  }
};

// 确保标签存在
export const ensureTagsExist = async (tagNames: string[]): Promise<Tag[]> => {
  try {
    const existingTags = await getTags();
    const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag]));

    const resultTags: Tag[] = [];

    for (const tagName of tagNames) {
      if (existingTagMap.has(tagName)) {
        resultTags.push(existingTagMap.get(tagName)!);
      } else {
        try {
          const newTag = await createTag(tagName);
          resultTags.push(newTag);
        } catch (error) {
          console.error(`Failed to create tag: ${tagName}`, error);
        }
      }
    }

    return resultTags;
  } catch (error) {
    console.error('Error ensuring tags exist:', error);
    return [];
  }
};

// 获取所有分类
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get('/api/categories') as any;
    return response.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// 创建分类
export const createCategory = async (name: string, description?: string): Promise<Category> => {
  try {
    const response = await apiClient.post('/api/categories', {
      name,
      description: description || name
    }) as any;
    return response.data || response;
  } catch (error) {
    console.error(`Error creating category: ${name}`, error);
    throw error;
  }
};

// 确保分类存在
export const ensureCategoryExists = async (categoryName: string): Promise<Category> => {
  try {
    const existingCategories = await getCategories();
    const existingCategory = existingCategories.find(category => category.name === categoryName);
    if (existingCategory) {
      return existingCategory;
    }
    const newCategory = await createCategory(categoryName);
    return newCategory;
  } catch (error) {
    console.error(`Error ensuring category exists: ${categoryName}`, error);
    throw error;
  }
};

// 创建博客
export const createBlog = async (blogData: Blog) => {
  try {
    const tags = await ensureTagsExist(blogData.tags);
    const tag_ids = tags.map(tag => tag.id);
    const category = await ensureCategoryExists(blogData.category);

    const articleData = {
      title: blogData.title,
      slug: blogData.title.toLowerCase().replace(/\s+/g, '-'),
      content: blogData.content,
      cover_image: blogData.coverImage,
      is_published: blogData.status === '已发布',
      category_id: category.id,
      tag_ids
    };

    const response = await apiClient.post('/api/articles', articleData) as any;
    const newArticle = response.data || response;

    const authorId = newArticle.author?.id?.toString() || '';
    return {
      id: newArticle.id?.toString() || '',
      title: newArticle.title,
      content: newArticle.content,
      author: newArticle.author?.username || '未知作者',
      authorId: authorId,
      userId: authorId,
      avatar: newArticle.author?.avatar || '',
      createTime: newArticle.created_at,
      updateTime: newArticle.updated_at,
      tags: newArticle.tags?.map((tag: any) => tag.name) || [],
      views: newArticle.view_count,
      likes: newArticle.like_count,
      comments: newArticle.comment_count,
      status: newArticle.is_published ? '已发布' : '草稿',
      category: newArticle.category?.name || '其他',
      coverImage: newArticle.cover_image
    };
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
};

// 更新博客
export const updateBlog = async (id: string, blogData: Partial<Blog>) => {
  try {
    const articleData: any = {};

    if (blogData.title !== undefined) {
      articleData.title = blogData.title;
      articleData.slug = blogData.title.toLowerCase().replace(/\s+/g, '-');
    }
    if (blogData.content !== undefined) {
      articleData.content = blogData.content;
    }
    if (blogData.coverImage !== undefined) {
      articleData.cover_image = blogData.coverImage;
    }
    if (blogData.status !== undefined) {
      articleData.is_published = blogData.status === '已发布';
    }
    if (blogData.tags !== undefined) {
      const tags = await ensureTagsExist(blogData.tags);
      articleData.tag_ids = tags.map(tag => tag.id);
    }
    if (blogData.category !== undefined) {
      const category = await ensureCategoryExists(blogData.category);
      articleData.category_id = category.id;
    }

    const response = await apiClient.put(`/api/articles/${id}`, articleData) as any;
    const updatedArticle = response.data || response;

    const authorId = updatedArticle.author?.id?.toString() || '';
    return {
      id: updatedArticle.id?.toString() || id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      author: updatedArticle.author?.username || '未知作者',
      authorId: authorId,
      userId: authorId,
      avatar: updatedArticle.author?.avatar || '',
      createTime: updatedArticle.created_at,
      updateTime: updatedArticle.updated_at,
      tags: updatedArticle.tags?.map((tag: any) => tag.name) || [],
      views: updatedArticle.view_count,
      likes: updatedArticle.like_count,
      comments: updatedArticle.comment_count,
      status: updatedArticle.is_published ? '已发布' : '草稿',
      category: updatedArticle.category?.name || '其他',
      coverImage: updatedArticle.cover_image
    };
  } catch (error) {
    console.error(`Error updating blog ${id}:`, error);
    throw error;
  }
};

// 删除博客
export const deleteBlog = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/articles/${id}`) as any;
    return response.data || response;
  } catch (error) {
    console.error(`Error deleting blog ${id}:`, error);
    throw error;
  }
};

// 获取文章评论
export const getComments = async (articleId: string) => {
  try {
    const response = await apiClient.get(`/api/comments/article/${articleId}`) as any;
    return response.data || response;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// 创建评论
export const createComment = async (data: { article_id: string; content: string }) => {
  try {
    const response = await apiClient.post('/api/comments', data) as any;
    return response.data || response;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// 点赞文章
export const likeArticle = async (articleId: string) => {
  try {
    const response = await apiClient.post('/api/likes', { article_id: articleId }) as any;
    return response.data || response;
  } catch (error) {
    console.error('Error liking article:', error);
    throw error;
  }
};

// 取消点赞
export const unlikeArticle = async (articleId: string) => {
  try {
    const response = await apiClient.delete(`/api/likes/article/${articleId}`) as any;
    return response.data || response;
  } catch (error) {
    console.error('Error unliking article:', error);
    throw error;
  }
};

// 检查是否已点赞
export const checkLiked = async (articleId: string): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/api/likes/check/${articleId}`) as any;
    return response.data?.liked || false;
  } catch (error) {
    console.error('Error checking liked status:', error);
    return false;
  }
};

// 收藏文章
export const favoriteArticle = async (articleId: string) => {
  try {
    const response = await apiClient.post('/api/favorites', { article_id: articleId }) as any;
    return response.data || response;
  } catch (error) {
    console.error('Error favoriting article:', error);
    throw error;
  }
};

// 取消收藏
export const unfavoriteArticle = async (articleId: string) => {
  try {
    const response = await apiClient.delete(`/api/favorites/${articleId}`) as any;
    return response.data || response;
  } catch (error) {
    console.error('Error unfavoriting article:', error);
    throw error;
  }
};

// 检查是否已收藏
export const checkFavorited = async (articleId: string): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/api/favorites/check/${articleId}`) as any;
    return response.data?.favorited || false;
  } catch (error) {
    console.error('Error checking favorited status:', error);
    return false;
  }
};
