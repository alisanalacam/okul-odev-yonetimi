"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import SubmissionDetailView from '@/components/parent/SubmissionDetailView';

export default function SubmissionWrapperPage() {
    const { token } = useAuth();
    const params = useParams();
    const submissionId = params.id;
    const [data, setData] = useState(null);

    const fetchData = useCallback(() => {
        if (token && submissionId) {
            console.log("Fetching data for submission:", submissionId);
            api.get(`/api/parent/submissions/${submissionId}`, token).then(setData);
        }
    }, [token, submissionId]);

    // Sayfa ilk yüklendiğinde veriyi çek
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return <SubmissionDetailView initialData={data} refreshData={fetchData} />;
}