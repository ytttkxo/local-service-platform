# ── Stage 1: Build ──────────────────────────────────────
# Use Maven to compile the project and produce a JAR file.
# This stage is discarded after the JAR is built (multi-stage build),
# so the final image stays small.
FROM maven:3.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (cached by Docker if pom.xml unchanged)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: Run ────────────────────────────────────────
# Only copy the JAR into a slim JRE image.
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
