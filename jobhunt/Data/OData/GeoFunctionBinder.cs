using System.Linq.Expressions;
using System.Reflection;

using Microsoft.AspNetCore.OData.Query.Expressions;
using Microsoft.OData.UriParser;

using JobHunt.Geocoding;

namespace JobHunt.Data.OData;
public class GeoFunctionBinder : IGeoFunctionBinder
{
    private readonly JobHuntContext _context;
    private readonly IGeocoder _geocoder;

    public GeoFunctionBinder(JobHuntContext context, IGeocoder geocoder)
    {
        _context = context;
        _geocoder = geocoder;
    }

    public Expression BindGeoFunction(
        SingleValueFunctionCallNode node,
        QueryBinderContext context,
        Func<IEnumerable<QueryNode>, QueryBinderContext, Expression[]> bindArgs, // Why is the BindArguments function internal?? Very annoying
        bool isOrderBy
    )
    {
        switch (node.Name)
        {
            case GeoFunctionBinder.GeoDistanceMethodName:
                Expression[] geoDistanceArgs = bindArgs(node.Parameters, context);

                return BindGeoDistance(geoDistanceArgs, _context);

            case GeoFunctionBinder.GeocodeMethodName:
                if (node.Parameters.First() is ConvertNode convert
                    && convert.Source is ConstantNode constant
                    && constant.Value is string location
                )
                {
                    Expression[] geocodeArgs = bindArgs(node.Parameters.Skip(1), context);

                    return BindGeocode(location, geocodeArgs, _context, _geocoder, isOrderBy);
                }
                else
                {
                    throw new InvalidOperationException("First parameter to geocode must be a string constant");
                }

            default:
                throw new InvalidOperationException($"Unknown geo function: {node.Name}");
        }
    }

    private static readonly IEnumerable<string> _boundFunctionNames = new[] { GeocodeMethodName, GeoDistanceMethodName };
    public bool IsFunctionBound(string name) => _boundFunctionNames.Contains(name);

    private const string GeoDistanceMethodName = "geodistance";
    private readonly MethodInfo _geoDistanceMethodInfo = typeof(JobHuntContext).GetMethod(nameof(JobHuntContext.GeoDistance))!;
    private Expression BindGeoDistance(IEnumerable<Expression> arguments, JobHuntContext dbContext)
    {
        return Expression.Call(Expression.Constant(dbContext), _geoDistanceMethodInfo, arguments.Select(a => ExtractValueFromNullableExpression(a)));
    }

    private const string GeocodeMethodName = "geocode";
    private Expression BindGeocode(string location, IEnumerable<Expression> arguments, JobHuntContext dbContext, IGeocoder geocoder, bool isOrderBy)
    {
        Coordinate? coord = geocoder.GeocodeAsync(location).Result;

        if (coord.HasValue)
        {
            List<Expression> args = new List<Expression>(4) {
                    Expression.Constant(coord.Value.Latitude),
                    Expression.Constant(coord.Value.Longitude)
                };
            args.AddRange(arguments);

            return BindGeoDistance(args, dbContext);
        }
        else if (isOrderBy)
        {
            return Expression.Constant(0); // can't OrderBy with null so return 0 instead
        }
        else
        {
            return Expression.Constant(null);
        }
    }

    private static Expression ExtractValueFromNullableExpression(Expression source)
    {
        return source.Type.IsNullable() ? Expression.Property(source, "Value") : source;
    }
}

public interface IGeoFunctionBinder
{
    Expression BindGeoFunction(
        SingleValueFunctionCallNode node,
        QueryBinderContext context,
        Func<IEnumerable<QueryNode>, QueryBinderContext, Expression[]> bindArgs,
        bool isOrderBy
    );
    bool IsFunctionBound(string name);
}