import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'workerProfile',
  title: 'Worker Profiles',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'jobRole',
      title: 'Job Role',
      type: 'string',
      description: 'Professional role or title (e.g., Plumber, Electrician, Carpenter)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Important for SEO and accessibility',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'languages',
      title: 'Languages',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Languages the worker can speak (e.g., English, Spanish, Mandarin)',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Primary work location (e.g., Sydney, NSW)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hasVehicleAccess',
      title: 'Has Vehicle Access',
      type: 'boolean',
      description: 'Does this worker have access to a vehicle?',
      initialValue: false,
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 6,
      description: 'Brief professional biography and expertise',
      validation: (Rule) => Rule.required().max(500),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Profile',
      type: 'boolean',
      description: 'Display this worker on the landing page',
      initialValue: false,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first (e.g., 1, 2, 3...)',
      validation: (Rule) => Rule.required().min(0),
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      jobRole: 'jobRole',
      location: 'location',
      media: 'image',
      featured: 'featured',
      hasVehicle: 'hasVehicleAccess',
    },
    prepare(selection) {
      const { title, jobRole, location, featured, hasVehicle } = selection
      const vehicleIcon = hasVehicle ? '🚗' : ''
      const featuredIcon = featured ? '⭐' : ''
      return {
        title: title,
        subtitle: `${jobRole} • ${location} ${vehicleIcon} ${featuredIcon}`.trim(),
        ...selection,
      }
    },
  },
})
