import { devicePairing } from '@/lib/domains';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, childId } = body;

    if (code) {
      const result = await devicePairing.pairDevice(code);

      if (!result.success) {
        return Response.json({ error: result.error }, { status: 400 });
      }

      return Response.json({
        success: true,
        child: result.child,
      });
    }

    if (childId) {
      const linkingCode = await devicePairing.generateLinkingCode(childId);

      if (!linkingCode) {
        return Response.json({ error: 'Failed to generate code' }, { status: 500 });
      }

      return Response.json({
        success: true,
        code: linkingCode,
      });
    }

    return Response.json({ error: 'Missing code or childId' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
