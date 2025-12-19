import { childrenDomain } from '@/lib/domains';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId');
    const childId = url.searchParams.get('childId');

    if (childId) {
      const child = await childrenDomain.getChild(childId);
      if (!child) {
        return Response.json({ error: 'Child not found' }, { status: 404 });
      }
      return Response.json({ child });
    }

    if (familyId) {
      const children = await childrenDomain.getFamilyChildren(familyId);
      return Response.json({ children });
    }

    return Response.json({ error: 'Missing familyId or childId' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { familyId, name, age } = body;

    if (!familyId || !name || !age) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await childrenDomain.createLinkedChild({
      familyId,
      name,
      age,
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      child: result.data,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { childId, ...updates } = body;

    if (!childId) {
      return Response.json({ error: 'Missing childId' }, { status: 400 });
    }

    const result = await childrenDomain.updateChild(childId, updates);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const childId = url.searchParams.get('childId');

    if (!childId) {
      return Response.json({ error: 'Missing childId' }, { status: 400 });
    }

    const result = await childrenDomain.deleteChild(childId);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
