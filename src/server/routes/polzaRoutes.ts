/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Маршруты Express API для Polza AI Engine (/api/polza/* и /api/assets/*)
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { polzaAiService } from '../services/polzaAiService';
import { ArtStylePreset } from '../../types/polzaAi';

const router = Router();

// A. ТЕКСТ И СТРУКТУРИРОВАННЫЙ JSON

// GET /api/polza/text-models
router.get('/text-models', (req: Request, res: Response) => {
  const models = polzaAiService.getTextModels();
  const defaultModel = models.find((m) => m.isDefault)?.id || 'deepseek/deepseek-r1-distill-llama-70b';
  res.json({
    success: true,
    models,
    defaultModel
  });
});

// POST /api/polza/generate-json
router.post('/generate-json', async (req: Request, res: Response) => {
  try {
    const { model, options, temperature, autoSaveToDatabase } = req.body || {};
    if (!options || !options.entityType) {
      return res.status(400).json({ success: false, error: 'Параметр options.entityType обязателен' });
    }

    const result = await polzaAiService.generateJsonEntity(options, model);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/polza/generate-json:', error);
    res.status(500).json({ success: false, error: error.message || 'Ошибка генерации сущности' });
  }
});

// POST /api/polza/generate-campaign
router.post('/generate-campaign', async (req: Request, res: Response) => {
  try {
    const options = req.body || {};
    if (!options.title) {
      options.title = 'Кровавое Затмение Драговии';
    }

    const campaign = await polzaAiService.generateCampaign(options);
    res.json({
      success: true,
      campaign,
      savedFilePath: `/api/assets/file/data/Campaigns/${campaign.id}.json`
    });
  } catch (error: any) {
    console.error('Error in /api/polza/generate-campaign:', error);
    res.status(500).json({ success: false, error: error.message || 'Ошибка генерации кампании' });
  }
});

// GET /api/polza/campaigns
router.get('/campaigns', (req: Request, res: Response) => {
  try {
    const campaignFiles = polzaAiService.listCampaigns();
    res.json({
      success: true,
      campaigns: campaignFiles
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// B. ГЕНЕРАЦИЯ АРТОВ И ИЗОБРАЖЕНИЙ

// GET /api/polza/models
router.get('/models', (req: Request, res: Response) => {
  const models = polzaAiService.getImageModels();
  const defaultModel = models.find((m) => m.isDefault)?.id || 'tongyi-mai/z-image';
  res.json({
    success: true,
    models,
    defaultModel
  });
});

// POST /api/polza/prompt
router.post('/prompt', (req: Request, res: Response) => {
  try {
    const { entity, stylePreset } = req.body || {};
    if (!entity) {
      return res.status(400).json({ success: false, error: 'Объект entity обязателен' });
    }

    const compiled = polzaAiService.compileArtPrompt(entity, (stylePreset as ArtStylePreset) || 'dnd_cinematic');
    res.json({
      success: true,
      prompt: compiled.prompt,
      optimalSize: compiled.optimalSize
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/polza/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { model, prompt, size, saveToDisk, transparentBackground } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Текст промпта обязателен' });
    }

    const imageResult = await polzaAiService.generateImage(prompt, size || '1024x1024', model, transparentBackground);
    const taskId = `task_${Date.now()}`;

    res.json({
      success: true,
      taskId,
      data: [
        {
          url: imageResult.url,
          localAssetUrl: imageResult.localAssetUrl
        }
      ]
    });
  } catch (error: any) {
    console.error('Error in /api/polza/generate:', error);
    res.status(500).json({ success: false, error: error.message || 'Ошибка генерации арта' });
  }
});

// GET /api/polza/status/:id
router.get('/status/:id', (req: Request, res: Response) => {
  const taskId = req.params.id;
  res.json({
    success: true,
    taskId,
    status: 'completed',
    progress: 100
  });
});

// POST /api/polza/save-image
router.post('/save-image', (req: Request, res: Response) => {
  try {
    const { imageBase64, filename } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Данные imageBase64 обязательны' });
    }

    const name = filename || `saved_${Date.now()}.png`;
    const aiDir = path.join(process.cwd(), 'assets', 'data', 'ai-generated');
    if (!fs.existsSync(aiDir)) fs.mkdirSync(aiDir, { recursive: true });

    const filePath = path.join(aiDir, name);
    const cleanB64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(cleanB64, 'base64'));

    const localAssetUrl = `/api/assets/file/data/ai-generated/${name}`;
    res.json({
      success: true,
      localAssetUrl
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/assets/file/*
router.get('/assets/file/*', (req: Request, res: Response) => {
  const reqPath = req.params[0];
  const fullPath = path.join(process.cwd(), 'assets', reqPath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.sendFile(fullPath);
  } else {
    res.status(404).send('Asset file not found');
  }
});

export default router;
