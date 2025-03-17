/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        xs: {
          css: {
            fontSize: '0.875rem',
            lineHeight: '1.5rem',
            h2: {
              fontSize: '1rem',
              marginTop: '1.25em',
              marginBottom: '0.5em',
            },
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            ul: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            'ul > li': {
              paddingLeft: '0.375em',
            },
          },
        },
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              '&:hover': {
                color: 'inherit',
                textDecoration: 'none',
              },
            },
            strong: {
              color: 'inherit',
            },
            h2: {
              color: 'inherit',
            },
            'ul > li::marker': {
              color: 'inherit',
            },
          },
        },
        blue: {
          css: {
            '--tw-prose-body': 'var(--tw-prose-blue)',
            '--tw-prose-headings': 'var(--tw-prose-blue)',
            '--tw-prose-links': 'var(--tw-prose-blue)',
            '--tw-prose-bold': 'var(--tw-prose-blue)',
            '--tw-prose-bullets': 'var(--tw-prose-blue)',
            '--tw-prose-quotes': 'var(--tw-prose-blue)',
            '--tw-prose-code': 'var(--tw-prose-blue)',
            '--tw-prose-hr': 'var(--tw-prose-blue)',
            '--tw-prose-th-borders': 'var(--tw-prose-blue)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
} 