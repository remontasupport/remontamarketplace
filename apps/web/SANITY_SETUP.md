# Sanity CMS Setup Guide for Remonta Newsroom

This guide will help you set up Sanity CMS for managing news articles.

## Step 1: Create a Sanity Account

1. Go to [sanity.io](https://www.sanity.io/)
2. Click "Get Started" and sign up (free account)
3. Create a new project called "Remonta Newsroom"

## Step 2: Get Your Project Credentials

After creating your project, you'll get:
- **Project ID**: Found in your project settings
- **Dataset**: Usually "production" (default)

## Step 3: Add Environment Variables

Create a `.env.local` file in your project root and add:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
```

Replace `your_project_id_here` with your actual Sanity project ID.

## Step 4: Create the Article Schema in Sanity Studio

1. Go to your Sanity project dashboard at [sanity.io/manage](https://www.sanity.io/manage)
2. Click on your "Remonta Newsroom" project
3. Click "Schema" in the sidebar
4. Create a new schema called `article` with the following structure:

### Article Schema Structure

```javascript
{
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required().max(200)
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string'
        }
      ]
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}]
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: Rule => Rule.required()
    },
    {
      name: 'readTime',
      title: 'Read Time',
      type: 'string',
      description: 'e.g., "5 min read"',
      validation: Rule => Rule.required()
    },
    {
      name: 'featured',
      title: 'Featured Article',
      type: 'boolean',
      description: 'Display as featured on homepage',
      initialValue: false
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block'
        },
        {
          type: 'image',
          options: {
            hotspot: true
          }
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage'
    }
  }
}
```

### Author Schema Structure

Also create an `author` schema:

```javascript
{
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      }
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4
    }
  ]
}
```

## Step 5: Alternative - Use Sanity CLI (Faster)

If you prefer using the CLI:

1. Install Sanity CLI globally:
```bash
npm install -g @sanity/cli
```

2. Initialize Sanity in a separate folder:
```bash
mkdir remonta-sanity
cd remonta-sanity
sanity init
```

3. Follow the prompts to connect to your project

4. Copy the schema files from `schemas/` folder to your Sanity project

## Step 6: Add Your First Article

1. Go to [your-project.sanity.studio](https://your-project.sanity.studio) or run `sanity start` locally
2. Click "+ Create" → "Author" to add an author first
3. Then create your first article
4. Fill in all required fields:
   - Title
   - Slug (auto-generated from title)
   - Excerpt
   - Main Image
   - Author
   - Published At
   - Read Time (e.g., "5 min read")
   - Body content
5. Click "Publish"

## Step 7: Verify Integration

1. Start your Next.js dev server: `npm run dev`
2. Visit `http://localhost:3000/newsroom`
3. Your articles should appear!

## API Access

The integration uses these queries:
- `getArticles()` - Fetch all published articles
- `getArticleBySlug(slug)` - Fetch single article
- `getFeaturedArticles()` - Fetch featured articles

## Helpful Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Studio](https://www.sanity.io/docs/sanity-studio)
- [GROQ Query Language](https://www.sanity.io/docs/groq)

## Support

If you need help:
1. Check Sanity documentation
2. Visit [Sanity Community](https://www.sanity.io/exchange/community)
3. Ask in their Slack channel

---

**Note**: Your Sanity project is on the free tier, which is perfect for production use with your current needs!
