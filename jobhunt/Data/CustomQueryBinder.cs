using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

using Microsoft.AspNetCore.OData.Query.Expressions;
using Microsoft.OData.UriParser;

using JobHunt.Extensions;

namespace JobHunt.Data {
    public class CustomFilterBinder : FilterBinder {
        private readonly JobHuntContext _context;

        public CustomFilterBinder(JobHuntContext context) {
            _context = context;
        }

        public override Expression BindSingleValueFunctionCallNode(SingleValueFunctionCallNode node, QueryBinderContext context) {
            switch (node.Name) {
                case GeoDistanceBinder.BoundMethodName:
                    Expression[] arguments = BindArguments(node.Parameters, context);

                    return GeoDistanceBinder.BindGeoDistance(arguments, _context);
                default:
                    return base.BindSingleValueFunctionCallNode(node, context);
            }
        }
    }

    public class CustomOrderByBinder : OrderByBinder {
        private readonly JobHuntContext _context;

        public CustomOrderByBinder(JobHuntContext context) {
            _context = context;
        }

        public override Expression BindSingleValueFunctionCallNode(SingleValueFunctionCallNode node, QueryBinderContext context) {
            switch (node.Name) {
                case GeoDistanceBinder.BoundMethodName:
                    Expression[] arguments = BindArguments(node.Parameters, context);

                    return GeoDistanceBinder.BindGeoDistance(arguments, _context);
                default:
                    return base.BindSingleValueFunctionCallNode(node, context);
            }
        }
    }

    public class CustomSelectExpandBinder : SelectExpandBinder {
        private readonly JobHuntContext _context;

        public CustomSelectExpandBinder(IFilterBinder filterBinder, IOrderByBinder orderByBinder, JobHuntContext context) : base(filterBinder, orderByBinder) {
            _context = context;
        }

        public override Expression BindSingleValueFunctionCallNode(SingleValueFunctionCallNode node, QueryBinderContext context) {
            switch (node.Name) {
                case GeoDistanceBinder.BoundMethodName:
                    Expression[] arguments = BindArguments(node.Parameters, context);

                    return GeoDistanceBinder.BindGeoDistance(arguments, _context);
                default:
                    return base.BindSingleValueFunctionCallNode(node, context);
            }
        }
    }

    public static class GeoDistanceBinder {
        public const string BoundMethodName = nameof(JobHuntContext.GeoDistance);
        private static readonly MethodInfo _geoDistanceMethodInfo = typeof(JobHuntContext).GetMethod(BoundMethodName)!;

        public static Expression BindGeoDistance(Expression[] arguments, JobHuntContext dbContext) {
            return Expression.Call(Expression.Constant(dbContext), _geoDistanceMethodInfo, arguments.Select(a => ExtractValueFromNullableExpression(a)));
        }

        private static Expression ExtractValueFromNullableExpression(Expression source) {
            return source.Type.IsNullable() ? Expression.Property(source, "Value") : source;
        }
    }
}