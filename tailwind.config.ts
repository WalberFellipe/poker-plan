import type { Config } from "tailwindcss";

/** Cor da paleta neon, com suporte a opacidade (`text-cy/40`). */
const rgb = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display / chrome: logo, títulos, botões, números, cartas.
        // Aponta para --pa-display, que o handoff define como a própria serifa
        // do corpo em 700. Trocar a variável troca todo o chrome de uma vez.
        display: ["var(--pa-display)", "Georgia", "serif"],
        // Corpo: parágrafos, títulos de tarefa, nomes de pessoas.
        sans: ["var(--font-source-serif)", "Georgia", "serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
      },
      colors: {
        pa: {
          bg: rgb("--pa-bg"),
          elevated: rgb("--pa-bg-elevated"),
          sunken: rgb("--pa-bg-sunken"),
          text: rgb("--pa-text"),
          muted: rgb("--pa-text-muted"),
          dim: rgb("--pa-text-dim"),
          faint: rgb("--pa-text-faint"),
          ghost: rgb("--pa-text-ghost"),
        },
        cy: {
          DEFAULT: rgb("--pa-cy"),
          deep: rgb("--pa-cy-deep"),
          ink: rgb("--pa-cy-ink"),
          soft: rgb("--pa-cy-soft"),
        },
        mg: {
          DEFAULT: rgb("--pa-mg"),
          soft: rgb("--pa-mg-soft"),
        },

        // Aliases shadcn, para os componentes de UI existentes.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        // O handoff usa raios muito pequenos: 2px em botões/campos/badges,
        // 3px em cards, 4px em cartas e modais.
        DEFAULT: "2px",
        sm: "2px",
        md: "3px",
        lg: "4px",
        card: "3px",
        chip: "999px",
      },
      boxShadow: {
        elevated: "0 30px 80px rgba(0,0,0,.55)",
        modal: "0 40px 100px rgba(0,0,0,.7)",
        "glow-cy": "0 0 16px rgb(var(--pa-cy) / .18)",
        "glow-cy-strong": "0 0 22px rgb(var(--pa-cy) / .3)",
        "glow-mg": "0 0 18px rgb(var(--pa-mg) / .25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cy-fill":
          "linear-gradient(180deg, rgb(var(--pa-cy)), rgb(var(--pa-cy-deep)))",
        // Verso da carta: listras diagonais ciano.
        "card-back":
          "repeating-linear-gradient(135deg, rgb(var(--pa-cy) / .16) 0 6px, rgba(10,10,20,.9) 6px 12px)",
      },
      animation: {
        rise: "pa-rise .4s ease both",
        "rise-slow": "pa-rise .5s ease both",
        flip: "pa-flip .5s ease both",
        pulse: "pa-pulse 1.8s ease-in-out infinite",
        "pulse-fast": "pa-pulse 1.6s ease-in-out infinite",
        count: "pa-count .8s ease-in-out infinite",
        float: "pa-float 7s ease-in-out infinite",
        land: "pa-land 1s cubic-bezier(.2,.7,.3,1) both",
        call: "pa-call 1.25s cubic-bezier(.2,.7,.3,1) both",
        shake: "pa-shake .5s ease both",
        sweep: "pa-sweep .7s cubic-bezier(.35,.1,.4,1) both",
        toast: "pa-toast .25s ease both",
      },
      transitionTimingFunction: {
        chip: "cubic-bezier(.2,.7,.3,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
