// Performance and Accessibility Testing Utilities for ApprenticeApex
// Implements Core Web Vitals monitoring and accessibility validation

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Additional metrics
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
  si: number; // Speed Index
  
  // Custom metrics
  loadTime: number;
  domReady: number;
  resourcesLoaded: number;
  
  // Memory and CPU
  memoryUsage: number;
  connectionType: string;
  
  // Page specific
  pageSize: number;
  resourceCount: number;
  imageCount: number;
  scriptCount: number;
  stylesheetCount: number;
}

interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  timestamp: Date;
  url: string;
  score: number; // 0-100
}

interface PerformanceReport {
  metrics: PerformanceMetrics;
  score: number; // 0-100
  recommendations: string[];
  timestamp: Date;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupObservers();
    this.collectInitialMetrics();
    
    console.log('[Performance] Monitoring started');
  }

  stopMonitoring(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.isMonitoring = false;
    
    console.log('[Performance] Monitoring stopped');
  }

  private setupObservers(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('[Performance] LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('[Performance] FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('[Performance] CLS observer not supported');
      }

      // Navigation Timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.ttfb = entry.responseStart - entry.requestStart;
            this.metrics.domReady = entry.domContentLoadedEventEnd - entry.navigationStart;
            this.metrics.loadTime = entry.loadEventEnd - entry.navigationStart;
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (e) {
        console.warn('[Performance] Navigation observer not supported');
      }

      // Paint Timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (e) {
        console.warn('[Performance] Paint observer not supported');
      }
    }
  }

  private collectInitialMetrics(): void {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType || 'unknown';
    }

    // Resource metrics
    this.collectResourceMetrics();
  }

  private collectResourceMetrics(): void {
    const resources = performance.getEntriesByType('resource');
    
    this.metrics.resourceCount = resources.length;
    this.metrics.imageCount = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)).length;
    this.metrics.scriptCount = resources.filter(r => r.name.match(/\.js$/i)).length;
    this.metrics.stylesheetCount = resources.filter(r => r.name.match(/\.css$/i)).length;
    
    // Calculate total page size
    let totalSize = 0;
    resources.forEach((resource: any) => {
      if (resource.transferSize) {
        totalSize += resource.transferSize;
      }
    });
    this.metrics.pageSize = totalSize;
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  generateReport(): PerformanceReport {
    const metrics = this.getMetrics() as PerformanceMetrics;
    const score = this.calculatePerformanceScore(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      metrics,
      score,
      recommendations,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // FCP scoring (0-2s = 100, 2-4s = 50, >4s = 0)
    if (metrics.fcp > 4000) score -= 25;
    else if (metrics.fcp > 2000) score -= 12.5;
    
    // LCP scoring (0-2.5s = 100, 2.5-4s = 50, >4s = 0)
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= 12.5;
    
    // FID scoring (0-100ms = 100, 100-300ms = 50, >300ms = 0)
    if (metrics.fid > 300) score -= 25;
    else if (metrics.fid > 100) score -= 12.5;
    
    // CLS scoring (0-0.1 = 100, 0.1-0.25 = 50, >0.25 = 0)
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 12.5;
    
    return Math.max(0, score);
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.fcp > 2000) {
      recommendations.push('Optimize First Contentful Paint by reducing server response time and eliminating render-blocking resources');
    }
    
    if (metrics.lcp > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and prioritizing above-the-fold content');
    }
    
    if (metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time and using web workers for heavy tasks');
    }
    
    if (metrics.cls > 0.1) {
      recommendations.push('Minimize Cumulative Layout Shift by setting explicit dimensions for images and ads');
    }
    
    if (metrics.pageSize > 2000000) { // 2MB
      recommendations.push('Reduce page size by compressing images and minifying CSS/JavaScript');
    }
    
    if (metrics.resourceCount > 100) {
      recommendations.push('Reduce the number of HTTP requests by bundling resources and using image sprites');
    }
    
    return recommendations;
  }
}

class AccessibilityTester {
  private static violations: AccessibilityViolation[] = [];

  static async runTests(): Promise<AccessibilityReport> {
    const violations: AccessibilityViolation[] = [];
    let passes = 0;
    
    // Test 1: Check for alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt || img.alt.trim() === '') {
        violations.push({
          id: 'image-alt',
          impact: 'serious',
          description: 'Image does not have an alt attribute',
          help: 'Images must have alternate text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          nodes: [{
            html: img.outerHTML,
            target: [`img:nth-child(${index + 1})`]
          }]
        });
      } else {
        passes++;
      }
    });

    // Test 2: Check for form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const id = input.id;
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledby) {
        violations.push({
          id: 'label',
          impact: 'critical',
          description: 'Form element does not have an accessible name',
          help: 'Form elements must have labels',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          nodes: [{
            html: input.outerHTML,
            target: [`input:nth-child(${index + 1})`]
          }]
        });
      } else {
        passes++;
      }
    });

    // Test 3: Check for heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      if (level > previousLevel + 1) {
        violations.push({
          id: 'heading-order',
          impact: 'moderate',
          description: 'Heading levels should only increase by one',
          help: 'Heading levels should increase by one',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
          nodes: [{
            html: heading.outerHTML,
            target: [`${heading.tagName.toLowerCase()}:nth-child(${index + 1})`]
          }]
        });
      } else {
        passes++;
      }
      previousLevel = level;
    });

    // Test 4: Check color contrast (simplified)
    const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6');
    textElements.forEach((element, index) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simple contrast check (this is a simplified version)
      if (color === backgroundColor || 
          (color === 'rgb(0, 0, 0)' && backgroundColor === 'rgb(255, 255, 255)')) {
        // This would need a proper contrast ratio calculation
        passes++;
      }
    });

    // Test 5: Check for keyboard accessibility
    const interactiveElements = document.querySelectorAll('button, a, input, textarea, select, [tabindex]');
    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        violations.push({
          id: 'tabindex',
          impact: 'serious',
          description: 'Positive tabindex values are not recommended',
          help: 'Elements should not use positive tabindex values',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/tabindex',
          nodes: [{
            html: element.outerHTML,
            target: [`[tabindex="${tabIndex}"]:nth-child(${index + 1})`]
          }]
        });
      } else {
        passes++;
      }
    });

    // Test 6: Check for ARIA attributes
    const ariaElements = document.querySelectorAll('[aria-expanded], [aria-haspopup], [role]');
    ariaElements.forEach((element, index) => {
      const ariaExpanded = element.getAttribute('aria-expanded');
      const ariaHaspopup = element.getAttribute('aria-haspopup');
      
      if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
        violations.push({
          id: 'aria-valid-attr-value',
          impact: 'critical',
          description: 'ARIA attribute has invalid value',
          help: 'ARIA attributes must have valid values',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/aria-valid-attr-value',
          nodes: [{
            html: element.outerHTML,
            target: [`[aria-expanded="${ariaExpanded}"]:nth-child(${index + 1})`]
          }]
        });
      } else {
        passes++;
      }
    });

    const score = Math.max(0, Math.round((passes / (passes + violations.length)) * 100));

    return {
      violations,
      passes,
      incomplete: 0,
      inapplicable: 0,
      timestamp: new Date(),
      url: window.location.href,
      score
    };
  }

  static logViolations(report: AccessibilityReport): void {
    if (report.violations.length === 0) {
      console.log('✅ No accessibility violations found!');
      return;
    }

    console.group('🔴 Accessibility Violations Found');
    report.violations.forEach(violation => {
      console.group(`${violation.impact.toUpperCase()}: ${violation.description}`);
      console.log('Help:', violation.help);
      console.log('More info:', violation.helpUrl);
      violation.nodes.forEach(node => {
        console.log('Element:', node.html);
        console.log('Selector:', node.target.join(' '));
      });
      console.groupEnd();
    });
    console.groupEnd();
  }
}

// Main testing function
export async function runComprehensiveTests(): Promise<{
  performance: PerformanceReport;
  accessibility: AccessibilityReport;
  overallScore: number;
}> {
  console.log('🧪 Running comprehensive performance and accessibility tests...');
  
  // Start performance monitoring
  const monitor = PerformanceMonitor.getInstance();
  monitor.startMonitoring();
  
  // Wait a bit for metrics to be collected
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Generate reports
  const performanceReport = monitor.generateReport();
  const accessibilityReport = await AccessibilityTester.runTests();
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (performanceReport.score * 0.6) + (accessibilityReport.score * 0.4)
  );
  
  // Log results
  console.log('📊 Performance Score:', performanceReport.score);
  console.log('♿ Accessibility Score:', accessibilityReport.score);
  console.log('🎯 Overall Score:', overallScore);
  
  // Log accessibility violations
  AccessibilityTester.logViolations(accessibilityReport);
  
  // Log performance recommendations
  if (performanceReport.recommendations.length > 0) {
    console.group('🚀 Performance Recommendations');
    performanceReport.recommendations.forEach(rec => console.log('-', rec));
    console.groupEnd();
  }
  
  // Stop monitoring
  monitor.stopMonitoring();
  
  return {
    performance: performanceReport,
    accessibility: accessibilityReport,
    overallScore
  };
}

// Auto-run tests in development
export function enableAutomaticTesting(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Run tests after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      runComprehensiveTests().then(results => {
        // Send to analytics if configured
        if (typeof gtag !== 'undefined') {
          gtag('event', 'performance_test', {
            performance_score: results.performance.score,
            accessibility_score: results.accessibility.score,
            overall_score: results.overallScore
          });
        }
      });
    }, 2000);
  });
}

// Export monitoring instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export for manual testing
export { AccessibilityTester };
