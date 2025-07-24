# Sport Tracker - Fitness Gamificada PWA

Una aplicación web progresiva (PWA) de fitness con gamificación, diseñada para motivar y trackear el progreso de entrenamiento de los usuarios.

## 🚀 Características

- **Offline-First**: Funciona sin conexión a internet
- **Gamificación**: Sistema de XP, niveles y achievements
- **Social**: Conecta con amigos del gym y comparte progreso
- **PWA**: Instalable como app nativa
- **Responsive**: Optimizada para móvil y desktop

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Estado**: Zustand
- **Validación**: Zod
- **Base de datos**: Supabase (próximamente)
- **Testing**: Vitest + Testing Library
- **PWA**: Vite PWA Plugin

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd sport-tracker

# Instalar dependencias
npm install

# Instalar dependencias de testing
bash install-test-deps.sh

# Iniciar servidor de desarrollo
npm run dev
```

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Tests con coverage
npm run test:coverage

# Ejecutar tests una vez
npm run test:run
```

## 🏗️ Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter
- `npm run format` - Formatear código
- `npm run type-check` - Verificar tipos TypeScript

## 📱 Funcionalidades Actuales

### ✅ Implementado
- Sistema de autenticación (local + guest mode)
- Interfaz responsive con navegación bottom-tab
- Sistema de temas (light/dark)
- Validación de formularios
- Logging y debugging tools
- Tests unitarios para autenticación

### 🚧 En Desarrollo
- Integración con Supabase
- Base de datos de ejercicios
- Sistema de workouts
- Gamificación completa

## 🎯 Roadmap

Ver el archivo [tasks.md](.kiro/specs/sport-tracker/tasks.md) para el plan completo de implementación.

## 🔧 Configuración de Desarrollo

### Variables de Entorno

Crear un archivo `.env.local`:

```env
# Supabase (cuando esté disponible)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Estructura del Proyecto

```
src/
├── components/     # Componentes React
├── pages/         # Páginas principales
├── stores/        # Estado global (Zustand)
├── services/      # Servicios y APIs
├── utils/         # Utilidades
├── types/         # Tipos TypeScript
├── schemas/       # Validaciones Zod
└── hooks/         # Custom hooks
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🎮 Demo

La aplicación incluye un usuario demo:
- **Email**: demo@example.com
- **Password**: Demo123!

También puedes usar el modo Guest para probar sin registro.