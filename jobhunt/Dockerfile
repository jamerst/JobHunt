FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build-env
WORKDIR /app

RUN curl -sL https://deb.nodesource.com/setup_15.x |  bash -
RUN apt-get install -y nodejs unzip

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
ADD . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:5.0
WORKDIR /app
RUN apt-get update
RUN curl -sL https://deb.nodesource.com/setup_15.x |  bash -
RUN apt-get install -y nodejs unzip libfreetype6 libfontconfig1 ca-certificates
COPY --from=build-env /app/out .
ENTRYPOINT ["dotnet", "jobhunt.dll"]