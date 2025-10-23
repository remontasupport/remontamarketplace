import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'job',
  title: 'Job Posting',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Job Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Location of the job (e.g., Sydney, NSW or Remote)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Job Description',
      type: 'text',
      rows: 10,
      description: 'Full description of the job role and responsibilities',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'certificates',
      title: 'Required Certificates',
      type: 'text',
      rows: 5,
      description: 'Instructions about what certificates will be needed',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      description: 'Day and time of the job (e.g., "Monday-Friday, 9am-5pm" or "Weekends, Flexible hours")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Active Status',
      type: 'boolean',
      description: 'Toggle to show/hide this job posting on the website',
      initialValue: true,
    }),
    defineField({
      name: 'postedAt',
      title: 'Posted Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When does this job start?',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      location: 'location',
      active: 'active',
    },
    prepare(selection) {
      const { title, location, active } = selection
      return {
        title: title,
        subtitle: `${location} - ${active ? '✅ Active' : '❌ Inactive'}`,
      }
    },
  },
})
