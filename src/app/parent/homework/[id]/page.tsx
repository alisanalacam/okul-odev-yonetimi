"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import SubmissionDetailView from '@/components/parent/SubmissionDetailView';

export default function HomeworkWrapperPage() {
    const { token, selectedStudent } = useAuth();
    const params = useParams();
    const homeworkId = params.id;
    const [data, setData] = useState(null);

    const fetchData = useCallback(() => {
        if (token && selectedStudent?.id && homeworkId) {
            console.log("Fetching data for homework:", homeworkId);
            api.get(`/api/parent/homeworks/${homeworkId}?studentId=${selectedStudent.id}`, token)
               .then(setData);
        }
    }, [token, selectedStudent, homeworkId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return <SubmissionDetailView initialData={data} refreshData={fetchData} />;
}