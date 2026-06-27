import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

// Helper para validar si la petición proviene de un usuario autenticado con rol 'admin'
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Cliente temporal con el token del usuario para verificar autenticidad
  const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data: { user }, error } = await tempClient.auth.getUser(token);
  if (error || !user) return null;

  // Consulta el perfil del usuario para ver su rol
  const adminClient = getSupabaseAdmin();
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return null;
  }

  return user;
}

// GET: Obtener todos los perfiles de usuario
export async function GET(request) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 401 });
    }

    const adminClient = getSupabaseAdmin();
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}

// POST: Registrar un nuevo usuario (Auth y Perfil)
export async function POST(request) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (email, password, role)' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();

    // 1. Crear usuario en auth de Supabase
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirmar correo automáticamente
    });

    if (authError) throw authError;

    // 2. Actualizar el perfil del usuario que el trigger inserta por defecto
    // (El trigger on_auth_user_created inserta el rol moderator por defecto, aquí lo forzamos al rol seleccionado)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error) {
    console.error('Error en POST /api/admin/users:', error);
    return NextResponse.json({ error: error.message || 'Error al crear usuario' }, { status: 500 });
  }
}

// PUT: Modificar el rol de un usuario existente
export async function PUT(request) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (id, role)' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();

    // Actualizar el rol en la tabla profiles
    const { error } = await adminClient
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en PUT /api/admin/users:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE: Eliminar un usuario completo
export async function DELETE(request) {
  try {
    const adminUser = await verifyAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de administrador.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del usuario a eliminar' }, { status: 400 });
    }

    // Evitar que el admin se elimine a sí mismo
    if (id === adminUser.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo.' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();

    // Eliminar de auth.users (la FK cascade eliminará el registro de profiles)
    const { error } = await adminClient.auth.admin.deleteUser(id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/admin/users:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar usuario' }, { status: 500 });
  }
}
