import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Container, Divider, Typography } from "@material-ui/core";
import { useParams } from "react-router";
import DOMPurify from "dompurify";

import Card from "../components/Card";
import ExpandableSnippet from "../components/ExpandableSnippet";
import Categories, { Category } from "../components/Categories";

type JobRouteParams = {
  id: string
}

type JobResponse = {
  id: number,
  title: string,
  description: string,
  salary?: string,
  location: string,
  url?: string,
  companyId?: number,
  companyName?: string,
  posted: string,
  notes?: string,
  archived: boolean,
  status: string,
  dateApplied?: string,
  categories: Category[],
  provider: string,
  sourceId?: number,
  sourceName?: string,
  seen: boolean
}

const Job = () => {
  const { id }: JobRouteParams = useParams();

  const [jobData, setJobData] = useState<JobResponse>();

  const fetchData = useCallback(async () => {
    const response = await fetch(`/api/jobs/${id}`, { method: "GET" });
    if (response.ok) {
      const data = await response.json() as JobResponse;

      if (!data.seen) {
        const response = await fetch(`/api/jobs/seen/${id}`, { method: "PATCH" });
        if (response.ok) {
          data.seen = true;
        } else {
          console.error(`API request failed: /api/jobs/seen/${id}, HTTP ${response.status}`);
        }
      }

      setJobData(data);
    } else {
      console.error(`API request failed: /api/jobs/${id}, HTTP ${response.status}`);
    }
  }, [id]);

  useEffect(() => { fetchData() }, [fetchData]);

  if (!jobData) {
    return null;
  }

  return (
    <Container>
      <Card title={jobData.title} titleVariant="h4" subtitle={`${jobData.companyName}, ${jobData.location}`} subtitleVariant="h6">
        <Box mx={3}>
          <Box mb={2}>
            <Typography variant="h6">{jobData.salary ?? "Unknown Salary"}</Typography>
            <Typography variant="subtitle2">From "{jobData.sourceName}"</Typography>
            <Box mt={1}>
              <Categories
                categories={jobData.categories}
                updateUrl={`/api/jobs/categories/${id}`}
                onCategoryAdd={(cats) => setJobData({ ...jobData, categories: cats})}
                onCategoryRemove={(id) => setJobData({ ...jobData, categories: jobData.categories.filter(c => c.id !== id)})}
              />
            </Box>
            <Box my={2}>
              <Button variant="contained" color="secondary" component="a" href={jobData.url} target="_blank">View Job</Button>
            </Box>
            <ExpandableSnippet>
              <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(jobData.description)}}></div>
            </ExpandableSnippet>
          </Box>
          <Divider/>
        </Box>
      </Card>
    </Container>
  );
}

export default Job;