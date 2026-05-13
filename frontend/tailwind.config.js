/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'health-red':    '#FF2D55',
        'health-orange': '#FF9500',
        'health-yellow': '#FFD60A',
        'health-green':  '#34C759',
        'health-teal':   '#5AC8FA',
        'health-blue':   '#0A84FF',
        'health-purple': '#BF5AF2',
        'health-pink':   '#FF375F',
        'health-indigo': '#5E5CE6',
      },
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        elevated: '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
