using System.Linq.Expressions;
using System.Reflection;
using Microsoft.OData.ModelBuilder;

namespace JobHunt.Extensions;
public static class ODataConventionModelBuilderExtensions
{
    /// <summary>
    /// Add an unmapped property to the OData model to allow usage in $select clauses
    /// </summary>
    /// <typeparam name="T">Entity type</typeparam>
    /// <param name="propertySelector">Lambda to select property</param>
    public static void AddUnmappedProperty<T>(this ODataConventionModelBuilder builder, Expression<Func<T, object>> propertySelector)
    {
        LambdaExpression lambda = propertySelector;

        MemberExpression member;
        if (lambda.Body is UnaryExpression unary)
        {
            member = (MemberExpression) unary.Operand;
        }
        else
        {
            member = (MemberExpression) lambda.Body;
        }

        builder.StructuralTypes.First(t => t.ClrType == typeof(T)).AddProperty((PropertyInfo) member.Member);
    }
}