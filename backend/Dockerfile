# ========================================================
# MediCore Backend Multi-Stage Dockerfile (Java 21)
# ========================================================

# --- Stage 1: Build Application with Maven & JDK 21 ---
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build executable jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Minimal Production JRE 21 Runtime ---
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Security: Create non-root application user and group
RUN addgroup -S medicore && adduser -S medicore -G medicore

# Install curl for container health checks
RUN apk add --no-cache curl

# Copy packaged jar from builder stage
COPY --from=builder /app/target/medicore-backend-1.0.0.jar app.jar
RUN chown -R medicore:medicore /app

USER medicore

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

