namespace JobHunt.Extensions;
public static class TypeExtensions
{
    public static bool IsNullable(this Type type)
    {
        return Nullable.GetUnderlyingType(type) != null;
    }

    public static Type TryGetUnderlyingType(this Type type, out bool wasNullable)
    {
        Type? underlying = Nullable.GetUnderlyingType(type);

        wasNullable = underlying != null;

        return underlying ?? type;
    }
}