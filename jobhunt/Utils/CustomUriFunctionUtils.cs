using System;
using System.Linq;
using System.Reflection;

using Microsoft.OData.Edm;
using Microsoft.OData.UriParser;

using JobHunt.Extensions;

namespace JobHunt.Utils {
    public static class CustomUriFunctionUtils {
        public static void AddCustomUriFunction(MethodInfo methodInfo) {
            IEdmPrimitiveTypeReference returnType = EdmCoreModel.Instance.GetPrimitive(
                EdmCoreModel.Instance.GetPrimitiveTypeKind(methodInfo.ReturnType.Name),
                methodInfo.ReturnType.IsNullable()
            );

            IEdmPrimitiveTypeReference[] parameterTypes = methodInfo.GetParameters()
                .Select(p => EdmCoreModel.Instance.GetPrimitive(
                    EdmCoreModel.Instance.GetPrimitiveTypeKind(p.ParameterType.Name),
                    p.ParameterType.IsNullable()
                ))
                .ToArray();

            CustomUriFunctions.AddCustomUriFunction(
                methodInfo.Name,
                new FunctionSignatureWithReturnType(returnType, parameterTypes)
            );
        }
    }
}