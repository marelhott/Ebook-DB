FROM golang:1.22-alpine AS build

WORKDIR /src

COPY go.mod ./
COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

FROM alpine:3.21

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /out/server /app/server

USER app

EXPOSE 8080

ENTRYPOINT ["/app/server"]
