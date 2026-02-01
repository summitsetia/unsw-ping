FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

RUN npm i -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
