using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

using Microsoft.OData.Edm;
using Microsoft.OData.UriParser;

using JobHunt.Extensions;

namespace JobHunt.Data.OData {
    public static class CustomUriFunctionUtils {
        public static void AddCustomUriFunction(MethodInfo methodInfo) {
            AddCustomUriFunction(
                methodInfo.Name.ToLower(),
                methodInfo.ReturnType,
                methodInfo.GetParameters().Select(p => p.ParameterType)
            );
        }

        public static void AddCustomUriFunction(string name, Type returnType, params Type[] parameterTypes) {
            AddCustomUriFunction(name, returnType, parameterTypes.AsEnumerable());
        }

        private static void AddCustomUriFunction(string name, Type returnType, IEnumerable<Type> parameterTypes) {
            IEdmPrimitiveTypeReference edmReturnType = EdmCoreModel.Instance.GetPrimitive(
                EdmCoreModel.Instance.GetPrimitiveTypeKind(returnType.TryGetUnderlyingType(out bool wasNullable).Name),
                wasNullable
            );

            IEdmPrimitiveTypeReference[] edmParamTypes = parameterTypes
                .Select(p => EdmCoreModel.Instance.GetPrimitive(
                    EdmCoreModel.Instance.GetPrimitiveTypeKind(p.TryGetUnderlyingType(out bool wasNullable).Name),
                    wasNullable
                ))
                .ToArray();

            CustomUriFunctions.AddCustomUriFunction(
                name,
                new FunctionSignatureWithReturnType(edmReturnType, edmParamTypes)
            );
        }
    }
}