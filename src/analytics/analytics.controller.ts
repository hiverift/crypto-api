// src/analytics/analytics.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  create(@Body() createAnalyticsDto: CreateAnalyticsDto) {
    return this.analyticsService.create(createAnalyticsDto);
  }

  @Get('totals')
  async getTotals() {
    return this.analyticsService.getTotals();
  }

  @Get('performance')
  async getPerformanceOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getPerformanceOverview(startDate, endDate);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() updateAnalyticsDto: UpdateAnalyticsDto) {
    return this.analyticsService.update(id, updateAnalyticsDto);
  }

  @Post('increment/:date')
  async incrementMetrics(@Param('date') date: string, @Body() body: { clicks?: number; signups?: number; earnings?: number }) {
    return this.analyticsService.incrementMetrics(date, body);
  }

  @Get()
  findAll() {
    return this.analyticsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.analyticsService.findOne(id);
  }
}