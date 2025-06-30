-- Insertar nuevo usuario empleado
INSERT INTO users (email, password, role, name, created_at, updated_at)
VALUES (
  'empleados@zonagaraje.com',
  '1122334455',
  'empleado',
  'Usuario Empleado',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updated_at = NOW();
