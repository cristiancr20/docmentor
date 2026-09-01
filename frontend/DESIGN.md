# Sistema de diseño de DocMentor

Vocabulario compartido con el resto de los proyectos (Pulso, portafolio,
password_save): superficies escalonadas separadas por bordes de 1px, un único
color de acento, y tokens semánticos que hacen innecesario el prefijo `dark:`.

## Regla principal

**Nunca escribas `dark:` en el markup.** Los tokens ya cambian solos.

```jsx
// mal
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">

// bien
<div className="bg-surface text-content">
```

Los tokens viven en `src/index.css` (`:root` y `:root.dark`) y se exponen como
utilidades de Tailwind en `tailwind.config.js`.

## Colores

| Token | Uso |
|---|---|
| `bg` | Fondo de la página |
| `surface` | Tarjetas, modales, barras |
| `surface-2` | Fondos hundidos: cabeceras de tabla, hovers, campos |
| `line` / `line-strong` | Bordes; `line-strong` en hover |
| `content` | Texto principal |
| `muted` | Texto secundario, etiquetas, metadatos |
| `accent` / `accent-soft` / `accent-wash` / `on-accent` | Acción e interactividad |
| `ok` `warn` `danger` `info` (+ `-wash`) | Estados |
| `dark-*` | Rampa fija para la barra lateral, oscura en ambos temas |

Un solo acento (índigo) por aplicación. Los colores de estado son intocables:
verde es éxito, rojo es error, y no se usan para decorar.

## Tipografía

- `font-display` (Space Grotesk): títulos y cifras.
- `font-sans` (Inter): cuerpo, formularios, tablas.
- `font-mono` (JetBrains Mono): correos, fechas, IDs, códigos, iniciales.

Escala: `text-xs` metadatos · `text-sm` cuerpo y controles · `text-lg
font-semibold` títulos de tarjeta · `text-2xl font-bold` cifras · `text-2xl
md:text-3xl font-bold` título de página.

Toda métrica lleva la clase `tabular` para que las cifras no bailen.

## Formas

- `rounded-lg`: botones, campos, elementos de navegación.
- `rounded-xl`: tarjetas, modales, filas de lista.
- `rounded-full`: badges, avatares.
- `rounded-2xl`: la navegación flotante móvil.

Sombras: solo `shadow-card` (tarjetas) y `shadow-pop` (modales y flotantes). En
oscuro la sombra de tarjeta desaparece y el borde hace el trabajo.

## Espaciado

Tarjeta `p-6` (compacta `p-5`) · `main` `p-6 md:p-8` · topbar `h-16` · lateral
`w-64` · huecos `gap-1.5 / 2 / 3 / 4 / 6`.

## Movimiento

`transition-colors` por defecto. Las animaciones de entrada son cortas
(0.15–0.2s) y **sin retardo escalonado por índice**: con listas largas el último
elemento tardaba segundos en aparecer. `prefers-reduced-motion` se respeta
globalmente desde `index.css`.

## Foco

Declarado una sola vez en `index.css` (`:focus-visible`). No añadas `focus:ring`
por componente.

## Componentes

Están en `src/components/ui/` y `src/components/layout/`. Úsalos en lugar de
repetir clases:

`Button` (primary/secondary/ghost/danger) · `Card` + `CardHeader` · `StatCard` ·
`Badge` (acepta `status` y elige el tono) · `Input` / `Select` / `Textarea` ·
`Modal` · `ThemeToggle` · `Skeleton` · `EmptyState` · `AppLayout` · `AuthLayout`.

Formateo compartido en `src/utils/format.js`: `formatDate`, `formatDateTime`,
`humanizeAction`, `initialsOf`. No reimplementes fechas.

## Iconos

Solo `lucide-react`, con `strokeWidth={1.8}` y tamaño `h-4 w-4` / `h-5 w-5`.
Convivían cuatro librerías (`react-icons/fa`, `/fa6`, `/md`, `/io5`, `/ci`,
`lucide-react`) más SVGs pegados a mano.
