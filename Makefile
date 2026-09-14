.DEFAULT_GOAL := help
# Windows 无 sh.exe 时强制使用 cmd 执行配方
ifeq ($(OS),Windows_NT)
SHELL := cmd.exe
.SHELLFLAGS := /c
endif

.PHONY: help install dev build preview typecheck clean

help: ## 显示可用命令
	@echo 每日拉伸 · 本地命令
	@echo ---------------------------------------
	@echo   make install     安装依赖
	@echo   make dev         启动开发服务器 (http://localhost:5173/exercises/)
	@echo   make build       类型检查 + 生产构建 (输出 dist/)
	@echo   make preview     构建并本地预览生产产物
	@echo   make typecheck   仅运行 TypeScript 类型检查
	@echo   make clean       清理 dist 与 node_modules

install: ## 安装依赖
	npm install

dev: ## 启动开发服务器
	npm run dev

build: ## 类型检查 + 生产构建
	npm run build

preview: build ## 构建并预览生产产物
	npm run preview

typecheck: ## TypeScript 类型检查
	npm run typecheck

clean: ## 清理产物与依赖
	npx --yes rimraf dist node_modules
