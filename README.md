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

## About
JobHunt started as a simple webscraper to somewhat automate my job searching after finishing university in summer 2020. After finding a job I decided to build it into a full web-app for friends to use, and to collect/archive interesting long-term data.

JobHunt is a React webapp with a ASP.NET 5/PostgreSQL backend. Search results are fetched through the [Indeed Publisher Jobs API](https://developer.indeed.com/docs/publisher-jobs/). Unfortunately this API is deprecated and doesn't appear to be being replaced, so this may not be a reliable long-term source.

## Installation
JobHunt is dockerised, so installation is very simple. Install docker and docker-compose, and clone the repository into a directory of your choice. JobHunt has only been tested to run under Linux, it might work under Windows.

### Configuration
Before running some configuration is required. All the configuration options are in `docker-compose-prod.yml`.

#### Indeed Publisher ID
You must provide your own Indeed Publisher ID by setting the value of `Search__IndeedPublisherId`. Unfortunately the API used is deprecated, and you can no longer obtain a publisher ID. Thankfully there are **many** publisher IDs left in the source code of other projects here on GitHub. I'll leave it to you to find one.

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

#### Other Options
- `Search__IndeedFetchSalary` - fetching accurate salary information from Indeed requires an extra request for every result, which may cause issues with rate limiting or IP blacklisting, especially for searches with a large number of results. You can disable this if you don't care about fetching salary.
- `Search__GlassdoorPartnerId` and `Search__GlassdoorPartnerKey` - currently unused (I may add Glassdoor searching in the future, but from my experience Indeed is better)
- `Search__NominatimCountryCodes` - country to return results from when geocoding locations. Set to your own country to get the most accurate results.
- `Search__PageLoadWaitSeconds` - number of seconds to wait before capturing page source HTML for watched pages which require JavaScript support. This allows Single Page Applications without server-side rendering to initialise so that the actual page content can be compared.


### Running JobHunt
Simply run `docker-compose -f docker-compose-prod.yml up -d` in the jobhunt directory.

## Usage
Once started, add a new search in the searches page. I would recommend limiting the maximum age to a small number, 7-14 days, otherwise you may experience problems with rate limiting/IP blacklisting if you choose to fetch salary data.

The new search will be run on the next schedule hit.

Jobs and companies can also be added manually from their respective pages.