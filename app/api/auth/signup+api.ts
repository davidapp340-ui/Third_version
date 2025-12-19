import { authDomain, familyDomain, childrenDomain } from '@/lib/domains';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, childName, childAge } = body;

    if (!email || !password || !fullName || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const signUpResult = await authDomain.signUp({
      email,
      password,
      fullName,
      role,
    });

    if (!signUpResult.success) {
      return Response.json({ error: signUpResult.error }, { status: 400 });
    }

    const userId = signUpResult.data!.userId;

    if (role === 'parent') {
      const familyResult = await familyDomain.createFamily({
        parentUserId: userId,
      });

      if (!familyResult.success) {
        return Response.json({ error: familyResult.error }, { status: 500 });
      }

      return Response.json({
        success: true,
        userId,
        familyId: familyResult.data!.id,
      });
    } else if (role === 'child_independent') {
      if (!childName || !childAge) {
        return Response.json(
          { error: 'Child name and age required for independent child' },
          { status: 400 }
        );
      }

      const childResult = await childrenDomain.createIndependentChild({
        userId,
        name: childName,
        age: childAge,
      });

      if (!childResult.success) {
        return Response.json({ error: childResult.error }, { status: 500 });
      }

      return Response.json({
        success: true,
        userId,
        childId: childResult.data!.id,
      });
    }

    return Response.json({ success: true, userId });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
