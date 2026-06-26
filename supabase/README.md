# Supabase

Esta carpeta contiene la migracion inicial de base de datos para el proyecto Finanzas Personales.

## Tablas creadas

- `persons`: personas disponibles para registrar movimientos personales. Incluye los registros iniciales `Marcos` y `Nayeli`.
- `personal_movements`: ingresos, sueldos y gastos asociados a una persona.
- `trip_movements`: movimientos del presupuesto de viaje.
- `savings_movements`: depositos y retiros del objetivo de ahorro en `PEN` o `USD`.
- `settings`: configuraciones generales del proyecto. Incluye `trip_name`, `savings_goal_name` y `savings_goal_amount_pen`.

Todas las tablas tienen Row Level Security activado y politicas basicas para permitir `select`, `insert`, `update` y `delete` solo al rol `authenticated`. No se crean politicas para acceso anonimo.

## Como aplicar la migracion desde Supabase SQL Editor

1. Abrir el proyecto en Supabase.
2. Ir a **SQL Editor**.
3. Crear una nueva query.
4. Copiar el contenido de `supabase/migrations/001_initial_schema.sql`.
5. Ejecutar la query.

## Estado

La migracion todavia no se ejecuto automaticamente en Supabase. Solo se creo el archivo SQL para aplicarlo manualmente cuando corresponda.
