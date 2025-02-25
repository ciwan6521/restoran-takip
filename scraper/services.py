import asyncio
from typing import Dict, List
from asgiref.sync import sync_to_async
from .scrapers import PLATFORM_SCRAPERS
from restaurants.models import Branch
import logging

logger = logging.getLogger(__name__)

async def check_branch_status(branch: Branch) -> Dict[str, bool]:
    """
    Bir şubenin tüm platformlardaki durumunu kontrol et
    """
    results = {}
    tasks = []

    # Yemeksepeti kontrolü
    if branch.yemeksepeti_url:
        tasks.append(
            PLATFORM_SCRAPERS['yemeksepeti'].check_status(branch)
        )
        
    # Migros kontrolü
    if branch.migros_api_key and branch.migros_restaurant_id:
        migros_status = await PLATFORM_SCRAPERS['migros'].check_status(branch)
        results['migros'] = migros_status
        logger.info(f"[Migros] Setting branch {branch.id} status to {migros_status}")
        
    # Getir kontrolü
    if branch.getir_url:
        tasks.append(
            PLATFORM_SCRAPERS['getir'].check_status(branch)
        )
    
    # Diğer platformların sonuçlarını bekle
    if tasks:
        statuses = await asyncio.gather(*tasks, return_exceptions=True)
        i = 0
        
        if branch.yemeksepeti_url:
            results['yemeksepeti'] = statuses[i]
            i += 1
        if branch.getir_url:
            results['getir'] = statuses[i]
            i += 1
    
    logger.info(f"[Branch {branch.id}] Final status results: {results}")
    return results

async def check_all_branches():
    """
    Tüm şubelerin durumunu kontrol et
    """
    branches = await sync_to_async(list)(Branch.objects.all())
    tasks = [check_branch_status(branch) for branch in branches]
    return await asyncio.gather(*tasks)
