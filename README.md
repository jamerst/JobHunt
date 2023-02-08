# JobHunt
JobHunt is a self-hosted web-app for easier job hunting. It allows jobs from multiple searches to be aggregated into a single source to make it much easier to keep track.

## Features
- Scheduled result fetching
- Page watching - get an alert when a webpage is updated
- Page change tracking - view the change history of a watched page
- Job categorisation
- Blacklist employers (_looking at you Noir Consulting with your constant fake ads_)
- Track application status and record notes (using Markdown syntax)
- Comprehensive job and employer searching
- Duplicate job detection using [trigrams](https://www.postgresql.org/docs/current/pgtrgm.html)

## About
JobHunt started as a simple webscraper to somewhat automate my job searching after finishing university in summer 2020. After finding a job I decided to build it into a full web-app for friends to use, and to collect/archive interesting long-term data.

JobHunt is a React webapp with a ASP.NET 7/PostgreSQL backend. Search results were previously fetched through the [Indeed Publisher Jobs API](https://developer.indeed.com/docs/publisher-jobs/), but this API was deprecated and has since stopped being reliable due to CAPTCHA checks on the API endpoint (because that's a good idea).

In February 2023 the source was switched to the Indeed GraphQL API which seems to be reliable at the moment, but is entirely unofficial.

## Installation
JobHunt is dockerised, so installation is very simple. Install docker and docker-compose, and clone the repository into a directory of your choice. JobHunt has only been tested to run under Linux, it might work under Windows.

### Configuration
Before running some configuration is required. All the configuration options are in `docker-compose-prod.yml`.

#### Indeed GraphQL API
Indeed has recently moved towards using a GraphQL API in their front-end app, so JobHunt can use this to fetch more information, including salary and job "tags" to automate job categorisation. This is the recommended data source for Indeed since it provides more information, is faster, and more reliable as of February 2023.

To enable the GraphQL API set `Search__Indeed__UseGraphQL` to `"true"` and provide an API key in `Search__Indeed__GraphQLApiKey`. To get an API key create an Indeed employer account, go to the jobs dashboard (https://employers.indeed.com/jobs), and look for requests to `/graphql` in dev tools, then copy the API key out of the `indeed-api-key` HTTP header of the request. You should also set the value of the `Search__Indeed__HostName` variable to the relevant host name for your country (e.g. `uk.indeed.com`).

You can change the unit used for distance searches by changing the value of `Search__Indeed__SearchRadiusUnit` to `MILES` or `KILOMETERS`.

I'm not sure how reliable this API will be, I would expect the API key to be revoked regularly, but I'm not sure how often that will be. If it's quite frequent I will investigate automating the retrieval of an API key.

#### Indeed Publisher ID
**Warning: the Indeed Publisher API is no longer reliable. You should use the GraphQL API instead.**

You must provide your own Indeed Publisher ID by setting the value of `Search__Indeed__PublisherId`. Unfortunately the API used is deprecated, and you can no longer obtain a publisher ID. Thankfully there are **many** publisher IDs left in the source code of other projects here on GitHub. I'll leave it to you to find one.

The GraphQL API can be used to replace the older salary fetching implementation as Indeed appear to have cracked down on securing the endpoint recently and it is not as reliable. To use this provide an Indeed GraphQL API key and set `Search__Indeed__UseGraphQLSalaryAndDescriptions` to `true`.

#### Scheduling
Edit the `Search__Schedules` variables to customise the schedule on which results will be fetched and watched pages checked. These use the standard Cron syntax. By default the refresh will run at 9am, 12pm, and 6pm every day. You may encounter issues with rate limiting or IP blacklisting if you set the schedule to be too frequent.

You should set the value of the `TZ` environment variable to make the schedule use your local time zone.

#### Screenshots
The page screenshot feature also has some configuration options:
- `Screenshots__Schedule` - the schedule for taking screenshots of any new page changes. Like the search schedules this uses the standard Cron syntax. Defaults to every 15 minutes.
- `Screenshots__Directory` - the directory to save the screenshots in within the container. You shouldn't need to change this, but if you do ensure that it remains in the `/jobhunt-data/` directory otherwise they won't be stored persistently.
- `Screenshots__QualityPercent` - the percentage quality to save screenshots at
- `Screenshots__WidthPixels` - the width of the screenshot in pixels. The height is determined by the page content.
- `Screenshots__PageLoadTimeoutSeconds` - JobHunt will wait for all images on the page to load before taking a screenshot. This option controls the maximum time to wait for before timing out.

#### Logging
Logging with JobHunt is provided by Serilog, which means it can support logging to multiple locations. By default JobHunt simply writes logs to the console, however it also supports logging to an ElasticSearch instance. To enable this simply uncomment the alternative Serilog configuration.

This is configured based on your ElasticSearch instance also being dockerised and part of the network `docker_logging`. If you use a non-dockerised instance simply remove all references to the `docker_logging` network and add in the appropriate Uri for your instance.

#### Duplicate Detection
There are a few options you can configure for duplicate job detection. You shouldn't need to change these values, but they are available if you want to tweak the thresholds. All these thresholds have a range of 0-1.

- `Search__CheckForDuplicateJobs` - enable/disable duplicate checking
- `Search__DuplicateCheckMonths` - window size to search for duplicate jobs in months (optional)
- `Search__DescriptionSimilarityThreshold` - the threshold for a job description to be considered the same as another when the title is also considered the same (range 0-1)
- `Search__TitleSimilarityThreshold` - the threshold for a job title to be considered the same as another (see above)
- `Search__IdenticalDescriptionSimilarityThreshold` - the threshold for a job description to be considered the same as another **even if the titles are not similar**.

#### Indeed Options
- `Search__Indeed__FetchSalary` - enables or disables the older salary fetching information. This method of fetching accurate salary information from Indeed requires an extra request for every result, which may cause issues with rate limiting or IP blacklisting, especially for searches with a large number of results. You can disable this if you don't care about fetching salary. **This fetching method has become more unreliable recently, so I recommend using GraphQL instead**.
- `Search__Indeed__UseGraphQL` - enables or disables using the Indeed GraphQL API. To use you must provide an API key in `Search__Indeed__GraphQLApiKey` (see above for how to obtain).

#### Other Options
- `Search__PageLoadWaitSeconds` - number of seconds to wait before capturing page source HTML for watched pages which require JavaScript support. This allows Single Page Applications without server-side rendering to initialise so that the actual page content can be compared.
- `CultureName` - set the culture used for the application. This affects the currency symbol used when adding the formatted salary for a job if Indeed doesn't provide one. For a list of languages/countries and their codes can be found [here](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-lcid/a9eac961-e77d-41a6-90a5-ce1a8b0cdb9c).

- `Search__NominatimCountryCodes` - country to return results from when geocoding locations. Set to your own country to get the most accurate results.

### Running JobHunt
Simply run `docker-compose -f docker-compose-prod.yml up -d` in the jobhunt directory.

## Usage
Once started, add a new search in the searches page. I would recommend limiting the maximum age to a small number, 7-14 days, otherwise you may experience problems with rate limiting/IP blacklisting if you choose to fetch salary data.

The new search will be run on the next schedule hit.

Jobs and companies can also be added manually from their respective pages.