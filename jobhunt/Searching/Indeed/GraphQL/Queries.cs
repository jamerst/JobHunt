namespace JobHunt.Searching.Indeed.GraphQL;

public static class Queries
{
    public const string JobDataQuery = """
        query Salary($jobKeys: [ID!]) {
            jobData(jobKeys: $jobKeys) {
                results {
                    job {
                        compensation {
                            baseSalary {
                                range {
                                    ... on AtLeast {
                                        __typename
                                        min
                                    }
                                    ... on AtMost {
                                        __typename
                                        max
                                    }
                                    ... on Exactly {
                                        __typename
                                        value
                                    }
                                    ... on Range {
                                        __typename
                                        max
                                        min
                                    }
                                }
                                unitOfWork
                            }
                            estimated {
                                baseSalary {
                                    range {
                                        ... on AtLeast {
                                            __typename
                                            min
                                        }
                                        ... on AtMost {
                                            __typename
                                            max
                                        }
                                        ... on Exactly {
                                            __typename
                                            value
                                        }
                                        ... on Range {
                                            __typename
                                            max
                                            min
                                        }
                                    }
                                    unitOfWork
                                }
                                formattedText
                            }
                            formattedText
                        }
                        key
                        description {
                            html
                        }
                        attributes {
                            label
                        }
                    }
                }
            }
        }
        """;

    public const string JobSearchQuery = """
        query JobSearch($cursor: String, $query: String, $location: JobSearchLocationInput, $limit: Int) {
            jobSearch(
                cursor: $cursor
                sort: DATE
                what: $query
                location: $location
                origin: GENERATED
                limit: $limit
            ) {
                results {
                    job {
                        key
                        title
                        description {
                            html
                        }
                        location {
                            formatted {
                                long
                            }
                            latitude
                            longitude
                        }
                        employer {
                            name
                        }
                        dateOnIndeed
                        attributes {
                            key
                        }
                        compensation {
                            baseSalary {
                                range {
                                    ... on Range {
                                        __typename
                                        max
                                        min
                                    }
                                    ... on Exactly {
                                        __typename
                                        value
                                    }
                                    ... on AtLeast {
                                        __typename
                                        min
                                    }
                                    ... on AtMost {
                                        __typename
                                        max
                                    }
                                }
                                unitOfWork
                            }
                            estimated {
                                baseSalary {
                                    range {
                                        ... on Range {
                                            __typename
                                            max
                                            min
                                        }
                                        ... on Exactly {
                                            __typename
                                            value
                                        }
                                        ... on AtLeast {
                                            __typename
                                            min
                                        }
                                        ... on AtMost {
                                            __typename
                                            max
                                        }
                                    }
                                    unitOfWork
                                }
                                formattedText
                            }
                            formattedText
                        }

                    }
                }
                pageInfo {
                    nextCursor
                }
            }
        }
        """;
}