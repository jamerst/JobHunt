using System.Linq.Expressions;

using Microsoft.AspNetCore.OData.Query.Expressions;
using Microsoft.OData.UriParser;

namespace JobHunt.Data.OData;
public class CustomFilterBinder : FilterBinder
{
    private readonly IGeoFunctionBinder _geoBinder;

    public CustomFilterBinder(IGeoFunctionBinder geoBinder)
    {
        _geoBinder = geoBinder;
    }

    public override Expression BindSingleValueFunctionCallNode(SingleValueFunctionCallNode node, QueryBinderContext context)
    {
        if (_geoBinder.IsFunctionBound(node.Name))
        {
            return _geoBinder.BindGeoFunction(node, context, BindArguments, false);
        }
        else
        {
            return base.BindSingleValueFunctionCallNode(node, context);
        }
    }
}

public class CustomOrderByBinder : OrderByBinder
{
    private readonly IGeoFunctionBinder _geoBinder;

    public CustomOrderByBinder(IGeoFunctionBinder geoBinder)
    {
        _geoBinder = geoBinder;
    }

    public override Expression BindSingleValueFunctionCallNode(SingleValueFunctionCallNode node, QueryBinderContext context)
    {
        if (_geoBinder.IsFunctionBound(node.Name))
        {
            return _geoBinder.BindGeoFunction(node, context, BindArguments, true);
        }
        else
        {
            return base.BindSingleValueFunctionCallNode(node, context);
        }
    }
}

public class CustomSelectExpandBinder : SelectExpandBinder
{
    private readonly IGeoFunctionBinder _geoBinder;

    public CustomSelectExpandBinder(IFilterBinder filterBinder, IOrderByBinder orderByBinder, IGeoFunctionBinder geoBinder) : base(filterBinder, orderByBinder)
    {
        _geoBinder = geoBinder;
    }

    public override Expression BindSingleValueFunctionCallNode(SingleValueFunctionCallNode node, QueryBinderContext context)
    {
        if (_geoBinder.IsFunctionBound(node.Name))
        {
            return _geoBinder.BindGeoFunction(node, context, BindArguments, false);
        }
        else
        {
            return base.BindSingleValueFunctionCallNode(node, context);
        }
    }
}