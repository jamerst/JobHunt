FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build-env
WORKDIR /app

RUN curl -sL https://deb.nodesource.com/setup_16.x |  bash -
RUN apt-get install -y nodejs unzip ca-certificates jq curl
RUN npm install -g pnpm

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
ADD . ./

# download and install geckodriver
RUN ./install-geckodriver.sh

RUN dotnet publish -c Release -o out


# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
RUN apt-get update
RUN curl -sL https://deb.nodesource.com/setup_16.x |  bash -
RUN apt-get install -y nodejs unzip libfreetype6 libfontconfig1 ca-certificates pandoc firefox-esr
COPY --from=build-env /app/out .
COPY --from=build-env /usr/local/bin/geckodriver /usr/local/bin/
ENTRYPOINT ["dotnet", "JobHunt.dll"]