from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os

app = FastAPI(title="AI Survey Form API")

# 允許前端進行跨域請求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Sheets 設定
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
SHEET_ID = '1dsMEy7b9pjWbEiBRBWGyOTQlJ9kinsXzf6kvWEh_WRk'
CREDENTIALS_FILE = 'credentials.json'

class SurveyAITool(BaseModel):
    name: str = ""
    percentage: int = 0
    purposes: List[str] = []

class SurveySubmission(BaseModel):
    company: str
    unit: str
    reporter: str
    date: str
    report_name: str
    used_ai: bool
    
    # 若未使用 AI，這些欄位為選填
    main_ai: Optional[SurveyAITool] = None
    sub_ai_1: Optional[SurveyAITool] = None
    sub_ai_2: Optional[SurveyAITool] = None
    other_ai: Optional[SurveyAITool] = None
    
    ai_participation_level: Optional[str] = None
    adoption_status: Optional[str] = None
    top_case_description: Optional[str] = None

def get_headers():
    return [
        "公司/中心", "單位", "提報人", "提報日期", "報告名稱", "是否使用AI協助",
        "主要AI名稱", "主要AI占比", "主要AI用途",
        "輔助AI1名稱", "輔助AI1占比", "輔助AI1用途",
        "輔助AI2名稱", "輔助AI2占比", "輔助AI2用途",
        "其他AI名稱", "其他AI占比", "其他AI用途",
        "AI參與程度", "成果最終採用情形", "主管肯定成果說明"
    ]

@app.post("/api/submit")
async def submit_survey(survey: SurveySubmission):
    try:
        if not os.path.exists(CREDENTIALS_FILE):
            raise HTTPException(status_code=500, detail="Missing Google Service Account credentials.json")
            
        creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, SCOPES)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SHEET_ID).sheet1
        
        # 檢查是否需要寫入標題列 (若表格為空)
        # 簡單的方式是看 row count 或直接不處理，這裡為了穩健，若第一列沒資料，則先寫入標題
        if not sheet.get_all_values():
            sheet.append_row(get_headers())
        
        # 格式化寫入的資料
        row = [
            survey.company,
            survey.unit,
            survey.reporter,
            survey.date,
            survey.report_name,
            "是" if survey.used_ai else "否"
        ]
        
        if survey.used_ai:
            row.extend([
                survey.main_ai.name if survey.main_ai else "",
                survey.main_ai.percentage if survey.main_ai else "",
                ", ".join(survey.main_ai.purposes) if survey.main_ai else "",
                
                survey.sub_ai_1.name if survey.sub_ai_1 else "",
                survey.sub_ai_1.percentage if survey.sub_ai_1 else "",
                ", ".join(survey.sub_ai_1.purposes) if survey.sub_ai_1 else "",
                
                survey.sub_ai_2.name if survey.sub_ai_2 else "",
                survey.sub_ai_2.percentage if survey.sub_ai_2 else "",
                ", ".join(survey.sub_ai_2.purposes) if survey.sub_ai_2 else "",
                
                survey.other_ai.name if survey.other_ai else "",
                survey.other_ai.percentage if survey.other_ai else "",
                ", ".join(survey.other_ai.purposes) if survey.other_ai else "",
                
                survey.ai_participation_level or "",
                survey.adoption_status or "",
                survey.top_case_description or ""
            ])
        else:
            # 補齊空字串
            row.extend([""] * 15)
            
        sheet.append_row(row)
        return {"status": "success", "message": "Survey submitted successfully"}
        
    except Exception as e:
        import logging
        logging.error(f"Error submitting to sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
